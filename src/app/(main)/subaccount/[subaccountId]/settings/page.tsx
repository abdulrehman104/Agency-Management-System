import { currentUser } from "@clerk/nextjs";

import { SubAccountForm } from "@/components/forms/subAccount-details";
import { UserForm } from "@/components/forms/user-details";
import { BlurPage } from "@/components/global/blur-page";
import db from "@/lib/db";

type Props = {
  params: { subaccountId: string };
};

export default async function SubAccountSettingsPage({ params }: Props) {
  /* ========== Get Authenticated User ========== */
  const authUser = await currentUser();
  if (!authUser) return;

  /* ========== Get User Details in our DB ========== */
  const userDetails = await db.user.findUnique({
    where: {
      email: authUser.emailAddresses[0].emailAddress,
    },
  });
  if (!userDetails) return;

  /* ========== Get SubAccount Details in our DB ========== */
  const subaccount = await db.subAccount.findUnique({
    where: {
      id: params.subaccountId,
    },
  });

  if (!subaccount) return;

  /* ========== Get Agency Details in our DB ========== */
  const agencyDetails = await db.agency.findUnique({
    where: {
      id: subaccount.agencyId,
    },
    include: { SubAccount: true },
  });

  if (!agencyDetails) return;

  /* ========== Extract All Subaccount in agency details ========== */
  const subAccounts = agencyDetails.SubAccount;

  return (
    <BlurPage>
      <div className="flex lg:!flex-row flex-col gap-4">
        {/*  ========== SubAccount Form ==========  */}
        <SubAccountForm
          agencyDetails={agencyDetails}
          userId={userDetails.id}
          userName={userDetails.name}
          details={subaccount}
        />

        {/*  ========== User Form ==========  */}
        <UserForm
          subAccounts={subAccounts}
          id={params.subaccountId}
          type="subaccount"
          userData={userDetails}
        />
      </div>
    </BlurPage>
  );
}
