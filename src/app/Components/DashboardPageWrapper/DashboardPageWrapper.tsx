"use client";

import DashboardLayout from "@/app/Components/Containers/DashboardLayout/DashboardLayout";
import DashboardContent from "@/app/Components/DashboardContent/DashboardContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";
import { useUserRole } from "@/app/hooks";

export default function DashboardPageWrapper() {
  const { hasFullAccess, isMaestro, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <AuthComponent>
        <DashboardLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <p>Cargando...</p>
          </div>
        </DashboardLayout>
      </AuthComponent>
    );
  }

  return (
    <AuthComponent>
      <DashboardLayout userIsAdmin={hasFullAccess} userIsOwner={isMaestro}>
        <DashboardContent />
      </DashboardLayout>
    </AuthComponent>
  );
}
