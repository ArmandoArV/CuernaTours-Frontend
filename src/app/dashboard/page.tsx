import DashboardLayout from "../Components/Containers/DashboardLayout/DashboardLayout";
import DashboardContent from "../Components/DashboardContent/DashboardContent";

export default function Dashboard() {
  // This is a server component - you can fetch data here from database/API
  // const userData = await getUserData(); // Example server-side data fetching
  
  return (
    <DashboardLayout userIsAdmin={true} userIsOwner={false}>
      <DashboardContent />
    </DashboardLayout>
  );
}
