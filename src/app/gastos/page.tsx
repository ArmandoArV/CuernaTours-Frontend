"use client";

import DashboardLayout from "@/app/Components/Containers/DashboardLayout/DashboardLayout";
import AdminSpendingsContent from "@/app/Components/AdminSpendingsContent/AdminSpendingsContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";
import RoleGuard from "@/app/Components/RoleGuard/RoleGuard";
import { UserRole } from "@/app/hooks/useUserRole";

export default function AdminSpendingsPage() {
  return (
    <AuthComponent>
      <RoleGuard allowedRoles={[UserRole.MAESTRO, UserRole.ADMINISTRADOR]}>
        <DashboardLayout userIsAdmin={true} userIsOwner={false}>
          <AdminSpendingsContent />
        </DashboardLayout>
      </RoleGuard>
    </AuthComponent>
  );
}
