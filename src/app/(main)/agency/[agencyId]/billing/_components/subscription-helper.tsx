"use client";

import { SubscriptionFormWrapper } from "@/components/forms/subscription-form/subscription-form-wrapper";
import { CustomModal } from "@/components/global/custom-modal";
import { PricesList } from "@/lib/types";
import { useModal } from "@/provider/modal-provider";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";

type Props = {
  prices: PricesList["data"];
  customerId: string;
  planExists: boolean;
};

export const SubscriptionHelper = ({
  customerId,
  planExists,
  prices,
}: Props) => {
  const { setOpen } = useModal();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

  useEffect(() => {
    if (plan)
      setOpen(
        <CustomModal
          title="Upgrade Plan!"
          description="Get started today to get access to premium features"
        >
          <SubscriptionFormWrapper
            planExists={planExists}
            customerId={customerId}
          />
        </CustomModal>,
        async () => ({
          plans: {
            defaultPriceId: plan ? plan : "",
            plans: prices,
          },
        })
      );
  }, [plan]);

  return <div></div>
};
