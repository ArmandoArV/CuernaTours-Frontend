import DashboardLayout from "@/app//Components/Containers/DashboardLayout/DashboardLayout";
import CreateOrderContent from "@/app/Components/CreateOrderContent/CreateOrderContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";

export default function CreateOrderPage() {
  // Server-side component - can fetch admin data here
  // const adminData = await getAdminData(); // Example server-side data fetching
  
  return (
    <AuthComponent>
      <DashboardLayout userIsAdmin={true} userIsOwner={false}>
        <CreateOrderContent />
      </DashboardLayout>
    </AuthComponent>
  );
}