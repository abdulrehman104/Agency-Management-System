import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { getAuthUserDetails, getNotificationAndUser, verifyAndAcceptInvitation } from "@/lib/queries";
import { Role } from "@prisma/client";
import { Unauthorized } from "@/components/unauthorized/index";
import { BlurPage } from "@/components/global/blur-page";
import { InfoBar } from "@/components/global/info-bar";
import { Sidebar } from "@/components/sidebar/index";

type props = {
  children: React.ReactNode;
  params: { subaccountId: string };
};

/* ================ SubAccount Layout Functionality ================  */
const SubAccountLayout = async ({ children, params }: props) => {

  /* ================ Get AgencyId & Current user Details ================  */
  const user = await currentUser();

  if (!user) {
    return redirect("/");
  }

  const agencyId = await verifyAndAcceptInvitation();
  if (!agencyId) {
    return redirect("/agency");
  }

  /* ================ Add Notification Logic & Get Notification or User data ================  */
  let notifications: any = [];

  if (!user.privateMetadata.role) {
    return <Unauthorized />;
  } else {
    const allPermissions = await getAuthUserDetails();
    const hasPermission = allPermissions?.Permissions.find(
      (permissions) =>
        permissions.access && permissions.subAccountId === params.subaccountId
    );

    if (!hasPermission) {
      return <Unauthorized />;
    }
  }

  const allNotifications = await getNotificationAndUser(agencyId);
  if (
    user.privateMetadata.role === "AGENCY_ADMIN" ||
    user.privateMetadata.role === "AGENCY_OWNER"
  ) {
    notifications = allNotifications;
  } else {
    const filteredNoti = allNotifications?.filter(
      (item) => item.subAccountId === params.subaccountId
    );
    if (filteredNoti) notifications = filteredNoti;
  }

  return (
    <div className="h-screen overflow-hidden">
      {/* ================ Sidebar Commponent ================*/}
      <Sidebar id={params.subaccountId} type="subaccount" />

      {/* ================ Info & Blur Commponent ================*/}
      <div className="md:pl-[300px]">
        <InfoBar
          notifications={notifications}
          role={user.privateMetadata.role as Role}
          subAccountId={params.subaccountId}
        />

        <div className="relative">
          <BlurPage>{children}</BlurPage>
        </div>
      </div>
    </div>
  );
};

export default SubAccountLayout;
