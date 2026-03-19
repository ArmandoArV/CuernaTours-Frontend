"use client";

import DashboardLayout from "@/app/Components/Containers/DashboardLayout/DashboardLayout";
import ValesContent from "@/app/Components/ValesContent/ValesContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";
import RoleGuard from "@/app/Components/RoleGuard/RoleGuard";
import { useUserRole, UserRole } from "@/app/hooks";

export default function ValesPage() {
  const { hasFullAccess, isMaestro } = useUserRole();

  return (
    <AuthComponent>
      <RoleGuard allowedRoles={[UserRole.MAESTRO, UserRole.ADMINISTRADOR]}>
        <DashboardLayout userIsAdmin={hasFullAccess} userIsOwner={isMaestro}>
          <ValesContent />
        </DashboardLayout>
      </RoleGuard>
    </AuthComponent>
  );
}
