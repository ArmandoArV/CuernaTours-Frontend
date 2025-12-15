import EditTripPageWrapper from "@/app/Components/EditTripPageWrapper/EditTripPageWrapper";

export default async function EditOrderTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditTripPageWrapper contractId={id} />;
}
