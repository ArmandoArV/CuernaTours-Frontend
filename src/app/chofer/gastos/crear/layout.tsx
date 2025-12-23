"use client";

import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";
import DriverDashboardLayout from "@/app/Components/Containers/DriverDashboardLayout/DriverDashboardLayout";
import RoleGuard from "@/app/Components/RoleGuard/RoleGuard";
import { UserRole } from "@/app/hooks/useUserRole";

export default function CreateSpendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthComponent>
      <RoleGuard allowedRoles={UserRole.CHOFER}>
        <DriverDashboardLayout>
          {children}
        </DriverDashboardLayout>
      </RoleGuard>
    </AuthComponent>
  );
}
