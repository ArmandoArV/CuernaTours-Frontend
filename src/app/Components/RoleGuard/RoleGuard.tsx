"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserRole, UserRole } from "@/app/hooks/useUserRole";
import LoadingComponent from "../LoadingComponent/LoadingComponent";

export type AllowedRole = UserRole | UserRole[];

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: AllowedRole;
  redirectTo?: string;
  showUnauthorized?: boolean;
}

/**
 * RoleGuard component to restrict access to specific user roles
 * 
 * Usage examples:
 * - <RoleGuard allowedRoles={UserRole.MAESTRO}> - Only Maestro
 * - <RoleGuard allowedRoles={[UserRole.MAESTRO, UserRole.ADMINISTRADOR]}> - Maestro or Admin
 * - <RoleGuard allowedRoles={UserRole.CHOFER} redirectTo="/"> - Redirect if not allowed
 */
export default function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = "/dashboard",
  showUnauthorized = false 
}: RoleGuardProps) {
  const router = useRouter();
  const { roleId, isLoading } = useUserRole();

  useEffect(() => {
    if (!isLoading && roleId !== null) {
      // Check if user's role is allowed
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      const isAllowed = rolesArray.includes(roleId);

      if (!isAllowed) {
        // Redirect drivers to their dashboard, others to main dashboard
        const destination = roleId === UserRole.CHOFER ? "/chofer/dashboard" : redirectTo;
        router.push(destination);
      }
    }
  }, [roleId, isLoading, allowedRoles, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return <LoadingComponent message="Verificando permisos..." />;
  }

  // Check authorization
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const isAllowed = roleId !== null && rolesArray.includes(roleId);

  if (!isAllowed) {
    if (showUnauthorized) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h2>Acceso No Autorizado</h2>
          <p>No tienes permisos para acceder a esta página.</p>
        </div>
      );
    }
    return null; // Will redirect
  }

  return <>{children}</>;
}

/**
 * Higher-order component version of RoleGuard
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: AllowedRole,
  redirectTo?: string
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles} redirectTo={redirectTo}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

/**
 * Hook to check if user has specific role(s)
 */
export function useHasRole(requiredRoles: AllowedRole): boolean {
  const { roleId } = useUserRole();
  
  if (roleId === null) return false;
  
  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return rolesArray.includes(roleId);
}
