import DashboardLayout from "@/app//Components/Containers/DashboardLayout/DashboardLayout";
import CreateOrderContent from "@/app/Components/CreateOrderContent/CreateOrderContent";
export default function CreateOrderPage() {
  // Server-side component - can fetch admin data here
  // const adminData = await getAdminData(); // Example server-side data fetching
  
  return (
    <DashboardLayout userIsAdmin={true} userIsOwner={false}>
      <CreateOrderContent />
    </DashboardLayout>
  );
}