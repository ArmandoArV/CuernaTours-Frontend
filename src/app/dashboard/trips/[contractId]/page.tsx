import TripsPageWrapper from "@/app/Components/TripsPageWrapper/TripsPageWrapper";

export default async function TripsPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  return <TripsPageWrapper contractId={contractId} />;
}
