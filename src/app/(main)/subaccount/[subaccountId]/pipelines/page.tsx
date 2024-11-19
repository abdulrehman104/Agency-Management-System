import { redirect } from "next/navigation";

import db from "@/lib/db";

type Props = {
  params: { subaccountId: string };
};

export default async function pipelines({ params }: Props) {

// {/* ========== Get Pipline in DB ========== */}
  const pipelineExists = await db.pipeline.findFirst({
    where: { subAccountId: params.subaccountId },
  });

// {/* ========== Pipline Exists redirect to Pipline ========== */}
  if (pipelineExists)
    return redirect(
      `/subaccount/${params.subaccountId}/pipelines/${pipelineExists.id}`
    );

// {/* ========== Pipline not Exists create new Pipline ========== */}
  try {
    const response = await db.pipeline.create({
      data: { name: "First Pipeline", subAccountId: params.subaccountId },
    });

    return redirect(
      `/subaccount/${params.subaccountId}/pipelines/${response.id}`
    );
  } catch (error) {
    console.log("Pipline Error", error);
  }
}
