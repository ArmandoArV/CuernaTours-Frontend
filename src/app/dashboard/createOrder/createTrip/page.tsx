import DashboardLayout from "@/app//Components/Containers/DashboardLayout/DashboardLayout";
import CreateTripContent from "@/app/Components/CreateTripContent/CreateTripContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";

export default function CreateOrderTripPage() {
  // Server-side component - can fetch admin data here
  // const adminData = await getAdminData(); // Example server-side data fetching
  
  return (
    <AuthComponent>
      <DashboardLayout userIsAdmin={true} userIsOwner={false}>
        <CreateTripContent />
      </DashboardLayout>
    </AuthComponent>
  );
}