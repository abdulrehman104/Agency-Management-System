import { currentUser } from "@clerk/nextjs";

import { AgencyForm } from "@/components/forms/agency-details";
import { UserForm } from "@/components/forms/user-details";
import db from "@/lib/db";

type Props = {
  params: { agencyId: string };
};

export default async function SettingPage({ params }: Props) {
  /* ========== Get Authenticated User ========== */
  const user = await currentUser();
  if (!user) return null;

  /* ========== Get User Details in our DB ========== */
  const userDetails = await db.user.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
  });

  if (!userDetails) return null;

  /* ========== Get Agency Details in our DB ========== */
  const agencyDetails = await db.agency.findUnique({
    where: { id: params.agencyId },
    include: { SubAccount: true },
  });

  if (!agencyDetails) return null;

  /* ========== Get Agency Subaccount Details ========== */
  const subAccounts = agencyDetails.SubAccount;

  return (
    <div className="flex flex-col lg:!flex-row gap-4">
      <AgencyForm data={agencyDetails} />
      <UserForm
        id={params.agencyId}
        type="agency"
        userData={userDetails}
        subAccounts={subAccounts}
      />
    </div>
  );
}
