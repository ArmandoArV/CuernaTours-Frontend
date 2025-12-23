"use client";

import DashboardLayout from "@/app/Components/Containers/DashboardLayout/DashboardLayout";
import DriverDashboardContent from "@/app/Components/DriverDashboardContent/DriverDashboardContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import { useUserRole } from "@/app/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DriverDashboardPageWrapper() {
  const router = useRouter();
  const { isDriverOnly, isLoading } = useUserRole();

  useEffect(() => {
    // If not a driver-only user, redirect to main dashboard
    if (!isLoading && !isDriverOnly) {
      router.push("/dashboard");
    }
  }, [isDriverOnly, isLoading, router]);

  if (isLoading) {
    return (
      <AuthComponent>
        <DashboardLayout>
          <LoadingComponent message="Cargando panel de chofer..." />
        </DashboardLayout>
      </AuthComponent>
    );
  }

  if (!isDriverOnly) {
    return null; // Will redirect
  }

  return (
    <AuthComponent>
      <DashboardLayout userIsAdmin={false} userIsOwner={false}>
        <DriverDashboardContent />
      </DashboardLayout>
    </AuthComponent>
  );
}
