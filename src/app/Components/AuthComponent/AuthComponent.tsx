"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  Spinner, 
  Text, 
  Card, 
  CardHeader,
  makeStyles,
  tokens 
} from "@fluentui/react-components";
import { authService, ApiError } from "@/services/api";
import LoadingComponent from "../LoadingComponent/LoadingComponent";
import { getCookie } from "@/app/Utils/CookieUtil";
import { UserRole } from "@/app/hooks/useUserRole";

const useLoadingStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingHorizontalXL,
  },
  card: {
    padding: tokens.spacingVerticalXXL,
    minWidth: '300px',
    textAlign: 'center',
    boxShadow: tokens.shadow16,
    borderRadius: tokens.borderRadiusLarge,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  spinnerContainer: {
    marginBottom: tokens.spacingVerticalM,
  },
});

type AuthRouteProps = {
  children: React.ReactNode;
};

export default function AuthComponent({ children }: AuthRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const styles = useLoadingStyles();
  
  useEffect(() => {
    const validateToken = async () => {
      try {
        const data = await authService.validate();

        if (data.tokenValid) {
          setIsAuthenticated(true);
          
          // Get user role from cookie
          const userCookie = getCookie("user");
          let userRole: number | null = null;
          
          if (userCookie) {
            try {
              const userData = JSON.parse(userCookie);
              userRole = userData.roleId || userData.role_id || null;
            } catch (e) {
              console.error("Error parsing user cookie:", e);
            }
          }
          
          // Auto redirect based on role if we're on the home page
          if (pathname === '/') {
            // Redirect drivers to their specific dashboard
            if (userRole === UserRole.CHOFER) {
              router.push("/chofer/dashboard");
            } else {
              // All other roles go to main dashboard
              router.push("/dashboard");
            }
          }
          // If a driver tries to access main dashboard, redirect to driver dashboard
          else if (pathname === '/dashboard' && userRole === UserRole.CHOFER) {
            router.push("/chofer/dashboard");
          }
        } else {
          // Token is invalid
          authService.clearSession();
          setIsAuthenticated(false);
          router.push("/");
        }
      } catch (error) {
        console.error("Token validation error (token expired or invalid):", error);
        
        // If response fails, token is expired or invalid - clear session and redirect to login
        authService.clearSession();
        setIsAuthenticated(false);
        router.push("/");
      }
    };

    validateToken();
  }, [router, pathname]);

  if (isAuthenticated === null) {
    return (
      <LoadingComponent message="Validando sesión, por favor espera..." />
    );
  }

  return <>{children}</>;
}
