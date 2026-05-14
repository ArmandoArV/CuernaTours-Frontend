"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/api";
import { getCookie } from "@/app/Utils/CookieUtil";
import { Logger } from "@/app/Utils/Logger";
import { showWarningAlert } from "@/app/Utils/AlertUtil";

const log = Logger.getLogger("AuthContext");

// ── Role enum & constants ────────────────────────────────────────────────────

export enum UserRole {
  MAESTRO = 1,
  ADMINISTRADOR = 2,
  CHOFER = 3,
  OFICINA = 4,
}

const ROLE_NAMES: Record<number, string> = {
  1: "Maestro",
  2: "Administrador",
  3: "Chofer",
  4: "Oficina",
};

// ── Public routes that don't require authentication ──────────────────────────

const PUBLIC_ROUTES = ["/", "/password-recovery"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

// ── User data shape (from cookie, used only as fallback display info) ───────

export interface AuthUser {
  user_id: string;
  userId: string;
  name: string;
  first_lastname: string;
  second_lastname: string;
  display_name: string;
  email: string;
  username: string;
  phone: string;
  role_id: number;
  roleId: number;
  role: string;
  picture_url: string | null;
  area_id: number | null;
  status: string;
}

// ── Context value shape ─────────────────────────────────────────────────────

export interface AuthContextValue {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;

  // Role flags — derived from server-validated role, NOT cookie
  roleId: number | null;
  roleName: string;
  isMaestro: boolean;
  isAdmin: boolean;
  isChofer: boolean;
  isOficina: boolean;

  // Permission flags
  hasFullAccess: boolean;
  canCreateOrders: boolean;
  canAssignResources: boolean;
  canAssignDrivers: boolean;
  canManagePayments: boolean;
  canViewAllContracts: boolean;
  isDriverOnly: boolean;

  // Actions
  logout: () => Promise<void>;
  revalidate: () => Promise<void>;
}

// ── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  // roleId is set from the server validate response, NOT the editable cookie
  const [roleId, setRoleId] = useState<number | null>(null);
  const hasValidatedRef = useRef(false);

  // Load display-only user info from cookie (name, email, picture, etc.)
  const loadUserFromCookie = useCallback(() => {
    try {
      const userCookie = getCookie("user");
      if (userCookie) {
        const userData: AuthUser = JSON.parse(userCookie);
        setUser(userData);
        return userData;
      }
    } catch (e) {
      log.error("Error parsing user cookie:", e);
    }
    setUser(null);
    return null;
  }, []);

  // Handle role-based redirects after successful auth
  const handleRoleRedirects = useCallback(
    (currentPath: string, serverRoleId: number | null) => {
      if (currentPath === "/") {
        if (serverRoleId === UserRole.CHOFER) {
          router.push("/chofer/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else if (
        currentPath === "/dashboard" &&
        serverRoleId === UserRole.CHOFER
      ) {
        router.push("/chofer/dashboard");
      }
    },
    [router],
  );

  // Kick user out — clear state and redirect
  const clearAndRedirect = useCallback(
    (currentPath: string, showExpiredModal = false) => {
      authService.clearSession();
      setIsAuthenticated(false);
      setUser(null);
      setRoleId(null);
      if (!isPublicRoute(currentPath)) {
        if (showExpiredModal) {
          showWarningAlert(
            "Sesión expirada",
            "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
            () => router.push("/"),
          );
        } else {
          router.push("/");
        }
      }
    },
    [router],
  );

  // Full server-side validation (API call)
  const validateAuth = useCallback(async () => {
    // Skip validation for public routes when there's no token
    if (isPublicRoute(pathname) && !authService.isAuthenticated()) {
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }

    // No token at all → not authenticated
    if (!authService.isAuthenticated()) {
      setIsAuthenticated(false);
      setIsLoading(false);
      if (!isPublicRoute(pathname)) {
        router.push("/");
      }
      return;
    }

    try {
      const data = await authService.validate();

      if (data.tokenValid) {
        setIsAuthenticated(true);
        const userData = loadUserFromCookie();

        // Prefer server-returned role_id (trusted); fall back to cookie
        // (the validate endpoint may omit the user field)
        const serverRoleId =
          data.user?.role_id ??
          userData?.roleId ??
          userData?.role_id ??
          null;
        setRoleId(serverRoleId);

        handleRoleRedirects(pathname, serverRoleId);
      } else {
        clearAndRedirect(pathname, true);
      }
    } catch (error) {
      log.error("Token validation error:", error);
      clearAndRedirect(pathname, true);
    } finally {
      setIsLoading(false);
    }
  }, [
    pathname,
    router,
    loadUserFromCookie,
    handleRoleRedirects,
    clearAndRedirect,
  ]);

  // Full validation on initial mount only
  useEffect(() => {
    if (!hasValidatedRef.current) {
      hasValidatedRef.current = true;
      validateAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lightweight token-exists check on every route change (no API call).
  // If the accessToken cookie was removed/expired, kick user out immediately.
  // If user just logged in (token appeared), trigger full revalidation.
  useEffect(() => {
    if (!hasValidatedRef.current) return; // skip before initial validation
    if (isPublicRoute(pathname)) return;

    const hasToken = authService.isAuthenticated();

    if (!hasToken) {
      log.warn("Token cookie missing on route change — logging out");
      clearAndRedirect(pathname, true);
    } else if (!isAuthenticated) {
      // Token exists but context says not authenticated (e.g. just logged in)
      validateAuth();
    }
  }, [pathname, clearAndRedirect, isAuthenticated, validateAuth]);

  // Re-validate from server when window regains focus
  useEffect(() => {
    const onFocus = () => {
      if (isAuthenticated) {
        validateAuth();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isAuthenticated, validateAuth]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      log.error("Logout error:", e);
      authService.clearSession();
    }
    setIsAuthenticated(false);
    setUser(null);
    setRoleId(null);
    router.push("/");
  }, [router]);

  // Derive all role/permission flags from server-validated roleId
  const value = useMemo<AuthContextValue>(() => {
    const isMaestro = roleId === UserRole.MAESTRO;
    const isAdmin = roleId === UserRole.ADMINISTRADOR;
    const isChofer = roleId === UserRole.CHOFER;
    const isOficina = roleId === UserRole.OFICINA;

    return {
      isAuthenticated,
      isLoading,
      user,

      roleId,
      roleName: roleId ? ROLE_NAMES[roleId] || "Usuario" : "Usuario",
      isMaestro,
      isAdmin,
      isChofer,
      isOficina,

      hasFullAccess: isMaestro || isAdmin,
      canCreateOrders: isMaestro || isAdmin || isOficina,
      canAssignResources: isMaestro || isAdmin || isOficina,
      canAssignDrivers: isMaestro || isAdmin,
      canManagePayments: isMaestro || isAdmin,
      canViewAllContracts: isMaestro || isAdmin || isOficina,
      isDriverOnly: isChofer,

      logout,
      revalidate: validateAuth,
    };
  }, [isAuthenticated, isLoading, user, roleId, logout, validateAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}

// Re-export helpers for backward compat
export function getRoleName(rid: number): string {
  return ROLE_NAMES[rid] || "Usuario";
}
