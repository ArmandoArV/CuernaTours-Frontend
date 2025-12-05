import DashboardLayout from "@/app//Components/Containers/DashboardLayout/DashboardLayout";
import EditOrderContent from "@/app/Components/EditOrderContent/EditOrderContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";

export default function EditOrderPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <AuthComponent>
      <DashboardLayout userIsAdmin={true} userIsOwner={false}>
        <EditOrderContent contractId={params.id} />
      </DashboardLayout>
    </AuthComponent>
  );
}
