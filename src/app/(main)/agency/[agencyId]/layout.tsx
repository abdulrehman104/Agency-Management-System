import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { getNotificationAndUser, verifyAndAcceptInvitation} from "@/lib/queries";
import { Sidebar } from "@/components/sidebar/index";
import { InfoBar } from "@/components/global/info-bar";
import { BlurPage } from "@/components/global/blur-page";
import { Unauthorized } from "@/components/unauthorized/index";

type props = {  
  children: React.ReactNode;
  params: { agencyId: string };
};

/* ================ Agency Layout Functionality ================  */
const AgencyLayout = async ({ children, params }: props) => {

/* ================ Get AgencyId & Current user dETAILS ================  */
  const agencyId = await verifyAndAcceptInvitation();
  const user = await currentUser();

  if (!user) {
    return redirect("/");
  }

  if (!agencyId) {
    return redirect("/agency");
  }

/* ================ Get Notification & User data ================  */
  let allNoti: any = [];
  const notifications = await getNotificationAndUser(agencyId);
  if (notifications) allNoti = notifications;

  /* ================ Agency & Subaccount SidebarLogo ================  */
  if (
    user.privateMetadata.role !== "AGENCY_OWNER" &&
    user.privateMetadata.role !== "AGENCY_ADMIN"
  )
    return <Unauthorized />;

  return (
    <div className="h-screen overflow-hidden">
      
{/* ================ Sidebar Commponent ================*/}
      <Sidebar id={params.agencyId} type="agency" />

{/* ================ Info & Blur Commponent ================*/}
      <div className="md:pl-[300px]">
        <InfoBar notifications={allNoti} role={allNoti.User?.role} />

        <div className="relative">
          <BlurPage>{children}</BlurPage>
        </div>
      </div>
    </div>
  );
};

export default AgencyLayout;
