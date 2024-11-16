"use client";

import { CreatePipelineForm } from "@/components/forms/create-pipline-forms";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { deletePipeline, saveActivityLogsNotification } from "@/lib/queries";
import { Pipeline } from "@prisma/client";
import { useRouter } from "next/navigation";
import React from "react";

export const PipelineSettings = ({
  pipelineId,
  subaccountId,
  pipelines,
}: {
  pipelineId: string;
  subaccountId: string;
  pipelines: Pipeline[];
}) => {
  const router = useRouter();

  const onDelete = async () => {
    try {
      await deletePipeline(pipelineId);

      await saveActivityLogsNotification({
        subaccountId: subaccountId,
        description: `Delete ${pipelineId} in DB`,
      });

      toast({
        title: "Deleted",
        description: "Pipeline is deleted",
      });
      router.replace(`/subaccount/${subaccountId}/pipelines`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oppse!",
        description: "Could Delete Pipeline",
      });
    }
  };

  return (
    <AlertDialog>
      <div>
        <div className="flex items-center justify-between mb-4">
          <AlertDialogTrigger asChild>
            <Button variant={"destructive"}>Delete Pipeline</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="items-center">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </div>

        <CreatePipelineForm
          subAccountId={subaccountId}
          defaultData={pipelines.find((p) => p.id === pipelineId)}
        />
      </div>
    </AlertDialog>
  );
};
