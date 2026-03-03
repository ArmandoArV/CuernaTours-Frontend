"use client";

import DashboardLayout from "@/app/Components/Containers/DashboardLayout/DashboardLayout";
import CreateSpendingContent from "@/app/Components/CreateSpendingContent/CreateSpendingContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";
import RoleGuard from "@/app/Components/RoleGuard/RoleGuard";
import { UserRole } from "@/app/hooks/useUserRole";

export default function AdminCreateSpendingPage() {
  return (
    <AuthComponent>
      <RoleGuard allowedRoles={[UserRole.MAESTRO, UserRole.ADMINISTRADOR]}>
        <DashboardLayout userIsAdmin={true} userIsOwner={false}>
          <CreateSpendingContent backRoute="/gastos" />
        </DashboardLayout>
      </RoleGuard>
    </AuthComponent>
  );
}
