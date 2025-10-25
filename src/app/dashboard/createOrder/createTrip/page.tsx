import DashboardLayout from "@/app//Components/Containers/DashboardLayout/DashboardLayout";
import CreateTripContent from "@/app/Components/CreateTripContent/CreateTripContent";
export default function CreateOrderTripPage() {
  // Server-side component - can fetch admin data here
  // const adminData = await getAdminData(); // Example server-side data fetching
  
  return (
    <DashboardLayout userIsAdmin={true} userIsOwner={false}>
      <CreateTripContent />
    </DashboardLayout>
  );
}