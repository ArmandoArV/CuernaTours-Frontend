import DashboardLayout from "../Components/Containers/DashboardLayout/DashboardLayout";
import UsersContent from "../Components/UsersContent/UsersContent";

export default function UsersPage() {
  // Server-side component - can fetch users data here
  // const usersData = await getUsersData(); // Example server-side data fetching
  
  return (
    <DashboardLayout userIsAdmin={true} userIsOwner={false}>
      <UsersContent />
    </DashboardLayout>
  );
}