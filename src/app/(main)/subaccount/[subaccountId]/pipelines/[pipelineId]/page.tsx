import { redirect } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelineInfoBar } from "../_components/pipeline-infobar";
import { PipelineSettings } from "../_components/pipeline-settings";
import { PipelineView } from "../_components/pipeline-view";

import {
  getLanesWithTicketAndTags,
  getPipelineDetails,
  updateLanesOrder,
  updateTicketsOrder,
} from "@/lib/queries";
import { LaneDetail } from "@/lib/types";
import db from "@/lib/db";

type Props = {
  params: { subaccountId: string; pipelineId: string };
};

export default async function PiplinePage({ params }: Props) {
  // {/* ========== Get pipline in the DB ========== */}
  const pipelineDetails = await getPipelineDetails(params.pipelineId);

  if (!pipelineDetails)
    return redirect(`/subaccount/${params.subaccountId}/pipelines`);

  // {/* ========== Get All piplines in the DB related to this subaccountId ========== */}
  const pipelines = await db.pipeline.findMany({
    where: { subAccountId: params.subaccountId },
  });

  // {/* ========== Get all lanes with Ticker and tags ========== */}
  const lanes = (await getLanesWithTicketAndTags(
    params.pipelineId
  )) as LaneDetail[];

  return (
    <Tabs defaultValue="view" className="w-full">
      <TabsList className="bg-transparent border-b-2 h-16 w-full justify-between mb-4">
        
        {/* ========== Pipline Information Bar ========== */}
        <PipelineInfoBar
          pipelineId={params.pipelineId}
          subAccountId={params.subaccountId}
          pipelines={pipelines}
        />
        <div>
          <TabsTrigger value="view">Pipeline View</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </div>
      </TabsList>

      {/* ========== Pipline View ========== */}
      <TabsContent value="view">
        <PipelineView
          lanes={lanes}
          pipelineDetails={pipelineDetails}
          pipelineId={params.pipelineId}
          subaccountId={params.subaccountId}
          updateLanesOrder={updateLanesOrder}
          updateTicketsOrder={updateTicketsOrder}
        />
      </TabsContent>

      {/* ========== Pipline Setting ========== */}
      <TabsContent value="settings">
        <PipelineSettings
          pipelineId={params.pipelineId}
          pipelines={pipelines}
          subaccountId={params.subaccountId}
        />
      </TabsContent>
    </Tabs>
  );
}
