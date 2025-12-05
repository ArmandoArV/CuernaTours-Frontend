"use client";

import DashboardLayout from "@/app/Components/Containers/DashboardLayout/DashboardLayout";
import EditOrderContent from "@/app/Components/EditOrderContent/EditOrderContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";
import { useUserRole } from "@/app/hooks";

interface EditOrderPageWrapperProps {
  contractId: string;
}

export default function EditOrderPageWrapper({ contractId }: EditOrderPageWrapperProps) {
  const { hasFullAccess, isMaestro, isLoading, canCreateOrders } = useUserRole();

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

  // Only users who can create orders should access this page
  if (!canCreateOrders) {
    return (
      <AuthComponent>
        <DashboardLayout>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '1rem' }}>
            <p style={{ color: '#dc2626' }}>No tienes permisos para editar órdenes.</p>
          </div>
        </DashboardLayout>
      </AuthComponent>
    );
  }

  return (
    <AuthComponent>
      <DashboardLayout userIsAdmin={hasFullAccess} userIsOwner={isMaestro}>
        <EditOrderContent contractId={contractId} />
      </DashboardLayout>
    </AuthComponent>
  );
}
