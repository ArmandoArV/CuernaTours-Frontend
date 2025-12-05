"use client";

import { useState, useEffect, useMemo } from "react";
import { getCookie } from "@/app/Utils/CookieUtil";

/**
 * User role types
 * 1 - Maestro: Full access
 * 2 - Administrador: Assigns drivers, units and payments
 * 3 - Chofer: Receives notifications about trips, can submit expenses
 * 4 - Oficina: Can create orders but not as detailed as Admin or Maestro
 */
export enum UserRole {
  MAESTRO = 1,
  ADMINISTRADOR = 2,
  CHOFER = 3,
  OFICINA = 4,
}

export interface UserRoleInfo {
  roleId: number | null;
  roleName: string;
  isMaestro: boolean;
  isAdmin: boolean;
  isChofer: boolean;
  isOficina: boolean;
  /** True if user is Maestro or Administrador (full management access) */
  hasFullAccess: boolean;
  /** True if user can create/edit orders (Maestro, Admin, Oficina) */
  canCreateOrders: boolean;
  /** True if user can assign drivers and vehicles (Maestro, Admin) */
  canAssignResources: boolean;
  /** True if user can manage payments (Maestro, Admin) */
  canManagePayments: boolean;
  /** True if user can view all contracts (Maestro, Admin, Oficina) */
  canViewAllContracts: boolean;
  /** True if user can only view their own trips (Chofer) */
  isDriverOnly: boolean;
  isLoading: boolean;
}

const ROLE_NAMES: { [key: number]: string } = {
  1: "Maestro",
  2: "Administrador",
  3: "Chofer",
  4: "Oficina",
};

/**
 * Hook to retrieve and manage user role information
 * @returns UserRoleInfo object with role details and permission flags
 */
export function useUserRole(): UserRoleInfo {
  const [roleId, setRoleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = () => {
      try {
        const userCookie = getCookie("user");
        if (userCookie) {
          const userData = JSON.parse(userCookie);
          const userRoleId = userData.roleId || userData.role_id || null;
          setRoleId(userRoleId);
        }
      } catch (error) {
        console.error("Error loading user role:", error);
        setRoleId(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserRole();
  }, []);

  const roleInfo = useMemo<UserRoleInfo>(() => {
    const isMaestro = roleId === UserRole.MAESTRO;
    const isAdmin = roleId === UserRole.ADMINISTRADOR;
    const isChofer = roleId === UserRole.CHOFER;
    const isOficina = roleId === UserRole.OFICINA;

    return {
      roleId,
      roleName: roleId ? ROLE_NAMES[roleId] || "Usuario" : "Usuario",
      isMaestro,
      isAdmin,
      isChofer,
      isOficina,
      hasFullAccess: isMaestro || isAdmin,
      canCreateOrders: isMaestro || isAdmin || isOficina,
      canAssignResources: isMaestro || isAdmin,
      canManagePayments: isMaestro || isAdmin,
      canViewAllContracts: isMaestro || isAdmin || isOficina,
      isDriverOnly: isChofer,
      isLoading,
    };
  }, [roleId, isLoading]);

  return roleInfo;
}

/**
 * Get role name from role ID
 * @param roleId The role ID number
 * @returns The role name string
 */
export function getRoleName(roleId: number): string {
  return ROLE_NAMES[roleId] || "Usuario";
}

/**
 * Check if a role ID has full access (Maestro or Admin)
 * @param roleId The role ID to check
 * @returns True if the role has full access
 */
export function hasFullAccess(roleId: number | null): boolean {
  return roleId === UserRole.MAESTRO || roleId === UserRole.ADMINISTRADOR;
}

/**
 * Check if a role ID can create orders
 * @param roleId The role ID to check
 * @returns True if the role can create orders
 */
export function canCreateOrders(roleId: number | null): boolean {
  return (
    roleId === UserRole.MAESTRO ||
    roleId === UserRole.ADMINISTRADOR ||
    roleId === UserRole.OFICINA
  );
}

export default useUserRole;
