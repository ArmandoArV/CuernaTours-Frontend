import DashboardLayout from "../Components/Containers/DashboardLayout/DashboardLayout";
import SettingsContent from "../Components/SettingsContent/SettingsContent";

export default function SettingsPage() {
  // Server-side component - can fetch settings data here
  // const settingsData = await getSystemSettings(); // Example server-side data fetching
  
  return (
    <DashboardLayout userIsAdmin={true} userIsOwner={true}>
      <SettingsContent />
    </DashboardLayout>
  );
}