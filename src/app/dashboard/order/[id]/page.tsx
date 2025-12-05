import EditOrderPageWrapper from "@/app/Components/EditOrderPageWrapper/EditOrderPageWrapper";

export default function EditOrderPage({
  params,
}: {
  params: { id: string };
}) {
  return <EditOrderPageWrapper contractId={params.id} />;
}
