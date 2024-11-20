import React from "react";
import { Plus } from "lucide-react";

import { FunnelForm } from "@/components/forms/funnel-form";
import { BlurPage } from "@/components/global/blur-page";
import FunnelsDataTable from "./data-table";
import { columns } from "./columns";
import { getFunnels } from "@/lib/queries";

type Props = {
  params: { subaccountId: string };
};

export default async function FunnelsPage({ params }: Props) {
  // {/* ========== Get All Funnels Details========== */}
  const funnels = await getFunnels(params.subaccountId);
  if (!funnels) return null;

  return (
    // {/* ========== Blur Page========== */}
    <BlurPage>
      {/* ========== Funnel Data Table ========== */}
      <FunnelsDataTable
        actionButtonText={
          <>
            <Plus size={15} />
            Create Funnel
          </>
        }
        modalChildren={<FunnelForm subAccountId={params.subaccountId} />}
        filterValue="name"
        columns={columns}
        data={funnels}
      />
    </BlurPage>
  );
}
