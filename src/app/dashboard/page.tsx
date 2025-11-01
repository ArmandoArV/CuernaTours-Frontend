import DashboardLayout from "@/app/Components/Containers/DashboardLayout/DashboardLayout";
import DashboardContent from "@/app/Components/DashboardContent/DashboardContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";
export default function Dashboard() {
  // This is a server component - you can fetch data here from database/API
  // const userData = await getUserData(); // Example server-side data fetching

  return (
    <AuthComponent>
      <DashboardLayout userIsAdmin={true} userIsOwner={false}>
        <DashboardContent />
      </DashboardLayout>
    </AuthComponent>
  );
}
