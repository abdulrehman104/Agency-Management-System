export default function AgencyDashboardPage({
  params,
}: {
  params: { agencyId: string };
}) {
  return (
    <>
      <p>{params.agencyId}</p>
    </>
  );
}
