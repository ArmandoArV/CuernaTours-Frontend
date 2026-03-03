"use client";

import { useUserRole } from "@/app/hooks/useUserRole";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";
import DashboardLayout from "../Components/Containers/DashboardLayout/DashboardLayout";
import DriverDashboardLayout from "../Components/Containers/DriverDashboardLayout/DriverDashboardLayout";
import ProfileContent from "../Components/ProfileContent/ProfileContent";

export default function ProfilePage() {
  const { isMaestro, isAdmin, isChofer, isLoading } = useUserRole();

  if (isLoading) return null;

  const Layout = isChofer ? DriverDashboardLayout : DashboardLayout;
  const layoutProps = isChofer
    ? {}
    : { userIsAdmin: isAdmin || isMaestro, userIsOwner: isMaestro };

  return (
    <AuthComponent>
      <Layout {...layoutProps}>
        <ProfileContent />
      </Layout>
    </AuthComponent>
  );
}