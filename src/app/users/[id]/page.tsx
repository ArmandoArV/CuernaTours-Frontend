"use client";

import { useParams } from "next/navigation";
import DashboardLayout from "@/app/Components/Containers/DashboardLayout/DashboardLayout";
import ProfileContent from "@/app/Components/ProfileContent/ProfileContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";
import RoleGuard from "@/app/Components/RoleGuard/RoleGuard";
import { UserRole } from "@/app/hooks/useUserRole";

export default function UserDetailPage() {
  const params = useParams();
  const userId = Number(params.id);

  return (
    <AuthComponent>
      <RoleGuard allowedRoles={[UserRole.MAESTRO, UserRole.ADMINISTRADOR]}>
        <DashboardLayout userIsAdmin={true} userIsOwner={false}>
          <ProfileContent userId={userId} />
        </DashboardLayout>
      </RoleGuard>
    </AuthComponent>
  );
}
