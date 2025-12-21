"use client";

import DashboardLayout from "@/app/Components/Containers/DashboardLayout/DashboardLayout";
import TripsContent from "@/app/Components/TripsContent/TripsContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";
import { useUserRole } from "@/app/hooks";

interface TripsPageWrapperProps {
  contractId: string;
}

export default function TripsPageWrapper({ contractId }: TripsPageWrapperProps) {
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
        <TripsContent contractId={contractId} />
      </DashboardLayout>
    </AuthComponent>
  );
}
