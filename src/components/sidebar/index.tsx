import { getAuthUserDetails } from "@/lib/queries";
import { MenuOptions } from "./menu-options";

/* ================ Agency & Subaccount Sidebar Props ================  */
type Props = {
  id: string;
  type: "agency" | "subaccount";
};

export const Sidebar = async ({ id, type }: Props) => {
  const user = await getAuthUserDetails();

  /* ================ Agency & Subaccount Details ================  */
  const details =
    type === "agency"
      ? user?.Agency
      : user?.Agency?.SubAccount.find((subaccount) => subaccount.id === id);

  /* ================ Agency & Subaccount SidebarLogo ================  */
  let sidebarLogo = user?.Agency?.agencyLogo || "/plura-logo.svg";

  const isWhiteLabeledAgency = user?.Agency?.whiteLabel;

  if (!isWhiteLabeledAgency) {
    if (type === "subaccount") {
      sidebarLogo =
        user?.Agency?.SubAccount.find((subaccount) => subaccount.id === id)
          ?.subAccountLogo || user?.Agency?.agencyLogo as string
    }
  }

  /* ================ Agency & Subaccount Sidebar Options ================  */
  const sidebarOpt =
    type === "agency"
      ? user?.Agency?.SidebarOption || []
      : user?.Agency?.SubAccount.find((subaccount) => subaccount.id === id)
          ?.SidebarOption || [];

  const subAccounts = user?.Agency?.SubAccount.filter((subaccount) =>
    user.Permissions.find(
      (permission) =>
        permission.subAccountId === subaccount.id && permission.access
    )
  );


  return (
    <>
      {/* ================ Dekstop Navbar ================  */}
      <MenuOptions
        id={id}
        defaultOpen={true}
        details={details}
        sidebarLogo={sidebarLogo}
        sidebarOpt={sidebarOpt}
        subAccounts={subAccounts} 
        user={user}
      />

      {/* ================ Mobile Navbar ================  */}
      <MenuOptions
        id={id}
        details={details}
        sidebarLogo={sidebarLogo}
        sidebarOpt={sidebarOpt}
        subAccounts={subAccounts}
        user={user}
      />
    </>
  );
};
