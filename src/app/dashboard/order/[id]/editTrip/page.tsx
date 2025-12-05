import DashboardLayout from "@/app//Components/Containers/DashboardLayout/DashboardLayout";
import EditTripContent from "@/app/Components/EditTripContent/EditTripContent";
import AuthComponent from "@/app/Components/AuthComponent/AuthComponent";

export default function EditOrderTripPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <AuthComponent>
      <DashboardLayout userIsAdmin={true} userIsOwner={false}>
        <EditTripContent contractId={params.id} />
      </DashboardLayout>
    </AuthComponent>
  );
}
