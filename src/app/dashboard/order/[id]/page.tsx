import EditOrderPageWrapper from "@/app/Components/EditOrderPageWrapper/EditOrderPageWrapper";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditOrderPageWrapper contractId={id} />;
}
