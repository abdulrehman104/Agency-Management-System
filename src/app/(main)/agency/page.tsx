import { currentUser } from "@clerk/nextjs";
import { Plan } from "@prisma/client";
import { redirect } from "next/navigation";

import { getAuthUserDetails, verifyAndAcceptInvitation } from "@/lib/queries";
import { AgencyForm } from "@/components/forms/agency-details";

const AgencyPage = async ({
  searchParams,
}: {
  searchParams: { plan: Plan; state: string; code: string };
}) => {
  
  /* ========== This function is used to check if the current user has a pending invitation associated with their email and, if so, to handle the acceptance of that invitation. ========== */
  const agencyId = await verifyAndAcceptInvitation();

  /* ========== Get the User Details  ========== */
  const user = await getAuthUserDetails();

  /* ========== Redirect user to route AC to this role  ========== */
  if (agencyId) {

    if (user?.role === "SUBACCOUNT_GUEST" || user?.role === "SUBACCOUNT_USER") {
      return redirect("/subaccount");
    } else if (user?.role === "AGENCY_OWNER" || user?.role === "AGENCY_ADMIN") {

      if (searchParams.plan) {
        return redirect(`/agency/${agencyId}/billing?plan=${searchParams.plan}`);
      }

      if (searchParams.state) {
        const statePath = searchParams.state.split("___")[0];
        const stateAgencyId = searchParams.state.split("___")[1];

        if (!stateAgencyId) return <div>Not authorized</div>;
        return redirect(`/agency/${stateAgencyId}/${statePath}?code=${searchParams.code}`);

      } else return redirect(`/agency/${agencyId}`);
    } else {
      return <div>Not authorized</div>;
    }
  }

  const authUser = await currentUser();

  return (
    <div className="flex items-center justify-center mt-4">
      <div className="max-w-[850px] border-[1px] p-4 rounded-xl">
        <h1 className="text-4xl text-center font-bold my-2">
          Create An Agency
        </h1>

        {/* ========== Agency Form  ========== */}
        <AgencyForm
          data={{ companyEmail: authUser?.emailAddresses[0].emailAddress }}
        />
      </div>
    </div>
  );
};

export default AgencyPage;
