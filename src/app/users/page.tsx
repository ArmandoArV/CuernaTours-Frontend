"use client";

import DashboardLayout from "../Components/Containers/DashboardLayout/DashboardLayout";
import UsersContent from "../Components/UsersContent/UsersContent";
import AuthComponent from "../Components/AuthComponent/AuthComponent";
import RoleGuard from "../Components/RoleGuard/RoleGuard";
import { UserRole } from "../hooks/useUserRole";

export default function UsersPage() {
  // Only Maestro and Administrador can manage users
  return (
    <AuthComponent>
      <RoleGuard allowedRoles={[UserRole.MAESTRO, UserRole.ADMINISTRADOR]}>
        <DashboardLayout userIsAdmin={true} userIsOwner={false}>
          <UsersContent />
        </DashboardLayout>
      </RoleGuard>
    </AuthComponent>
  );
}