import { currentUser } from "@clerk/nextjs";
import { Plus } from "lucide-react";

import { SendInvitationForm } from "@/components/forms/send-invitation";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import db from "@/lib/db";

type Props = {
  params: { agencyId: string };
};

export default async function TeamPage({ params }: Props) {
  // {/* ========== Get Current User ========== */}
  const authUser = await currentUser();

  if (!authUser) return null;

  // {/* ========== Get all user in this agency ========== */}
  const teamMember = await db.user.findMany({
    where: {
      Agency: {
        id: params.agencyId,
      },
    },
    include: {
      Agency: { include: { SubAccount: true } },
      Permissions: { include: { SubAccount: true } },
    },
  });

  if (!teamMember) return null;

  // {/* ========== Get Agency Details ========== */}
  const agencyDetails = await db.agency.findUnique({
    where: { id: params.agencyId },
    include: { SubAccount: true },
  });

  if (!agencyDetails) return null;

  return (
    <DataTable
      data={teamMember}
      columns={columns}
      filterValue="name"
      modalChildren={<SendInvitationForm agencyId={agencyDetails.id} />}
      actionButtonText={
        <>
          <Plus size={15} /> Add
        </>
      }
    />
  );
}
