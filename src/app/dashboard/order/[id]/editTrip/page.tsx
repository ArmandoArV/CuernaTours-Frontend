import EditTripPageWrapper from "@/app/Components/EditTripPageWrapper/EditTripPageWrapper";

export default function EditOrderTripPage({
  params,
}: {
  params: { id: string };
}) {
  return <EditTripPageWrapper contractId={params.id} />;
}
