"use client";

import DashboardLayout from "../Components/Containers/DashboardLayout/DashboardLayout";
import AdminContent from "../Components/AdminContent/AdminContent";
import AuthComponent from "../Components/AuthComponent/AuthComponent";
import RoleGuard from "../Components/RoleGuard/RoleGuard";
import { UserRole } from "../hooks/useUserRole";

export default function AdminPage() {
  // Only Maestro and Administrador can access
  return (
    <AuthComponent>
      <RoleGuard allowedRoles={[UserRole.MAESTRO, UserRole.ADMINISTRADOR]}>
        <DashboardLayout userIsAdmin={true} userIsOwner={false}>
          <AdminContent />
        </DashboardLayout>
      </RoleGuard>
    </AuthComponent>
  );
}