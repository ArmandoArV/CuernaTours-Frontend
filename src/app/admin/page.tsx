import DashboardLayout from "../Components/Containers/DashboardLayout/DashboardLayout";
import AdminContent from "../Components/AdminContent/AdminContent";

export default function AdminPage() {
  // Server-side component - can fetch admin data here
  // const adminData = await getAdminData(); // Example server-side data fetching
  
  return (
    <DashboardLayout userIsAdmin={true} userIsOwner={false}>
      <AdminContent />
    </DashboardLayout>
  );
}