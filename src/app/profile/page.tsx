import DashboardLayout from "../Components/Containers/DashboardLayout/DashboardLayout";
import ProfileContent from "../Components/ProfileContent/ProfileContent";

export default function ProfilePage() {
  // Server-side component - can fetch user data here
  // const userData = await getUserProfile(); // Example server-side data fetching
  
  return (
    <DashboardLayout userIsAdmin={false} userIsOwner={false}>
      <ProfileContent />
    </DashboardLayout>
  );
}