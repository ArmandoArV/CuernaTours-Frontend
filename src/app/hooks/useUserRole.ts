"use client";

import { useMemo } from "react";
import { useAuth } from "@/app/Contexts/AuthContext/AuthContext";

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
  /** True if user can assign drivers and vehicles (Maestro, Admin, Oficina) */
  canAssignResources: boolean;
  /** True if user can assign specific drivers to units (Maestro, Admin) */
  canAssignDrivers: boolean;
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
 * Hook to retrieve and manage user role information.
 * Delegates to AuthContext — no cookie parsing, no extra state.
 * @returns UserRoleInfo object with role details and permission flags
 */
export function useUserRole(): UserRoleInfo {
  const auth = useAuth();

  return useMemo<UserRoleInfo>(
    () => ({
      roleId: auth.roleId,
      roleName: auth.roleName,
      isMaestro: auth.isMaestro,
      isAdmin: auth.isAdmin,
      isChofer: auth.isChofer,
      isOficina: auth.isOficina,
      hasFullAccess: auth.hasFullAccess,
      canCreateOrders: auth.canCreateOrders,
      canAssignResources: auth.canAssignResources,
      canAssignDrivers: auth.canAssignDrivers,
      canManagePayments: auth.canManagePayments,
      canViewAllContracts: auth.canViewAllContracts,
      isDriverOnly: auth.isDriverOnly,
      isLoading: auth.isLoading,
    }),
    [auth],
  );
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
