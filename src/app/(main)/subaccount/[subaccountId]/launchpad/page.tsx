import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { getStripeOAuthLink } from "@/lib/utils";
import db from "@/lib/db";
import { stripe } from "@/lib/stripe";

type Props = {
  params: { subaccountId: string };
  searchParams: { code: string };
};

export default async function LaunchpadPage({ params, searchParams }: Props) {
  const subaccountDetails = await db.subAccount.findUnique({
    where: { id: params.subaccountId },
  });

  if (!subaccountDetails) return;

  const allDetailsExist =
    subaccountDetails.address &&
    subaccountDetails.subAccountLogo &&
    subaccountDetails.city &&
    subaccountDetails.companyEmail &&
    subaccountDetails.companyPhone &&
    subaccountDetails.country &&
    subaccountDetails.name &&
    subaccountDetails.state;

  const stripeOAuthLink = getStripeOAuthLink(
    "subaccount",
    `launchpad___${subaccountDetails.id}`
  );

  let connectedStripeAccount = false;

  if (searchParams.code) {
    if (!subaccountDetails.connectAccountId) {
      try {
        const response = await stripe.oauth.token({
          grant_type: "authorization_code",
          code: searchParams.code,
        });
        await db.subAccount.update({
          where: { id: params.subaccountId },
          data: { connectAccountId: response.stripe_user_id },
        });
        connectedStripeAccount = true;
      } catch (error) {
        console.log("🔴 Could not connect stripe account", error);
      }
    }
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="w-full h-full max-w-[800px]">
        <Card className="border-none">
          {/* ========== Card Header ========== */}
          <CardHeader>
            <CardTitle>Lets get started!</CardTitle>
            <CardDescription>
              Follow the steps below to get your account setup correctly.
            </CardDescription>
          </CardHeader>

          {/* ========== Card Content ========== */}
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              {/* ========== First Step ========== */}
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src="/appstore.png"
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p> Save the website as a shortcut on your mobile device</p>
              </div>
              <Button>Start</Button>
            </div>

            {/* ========== Stripe Integration Step ========== */}
            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src="/stripelogo.png"
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p>
                  Connect your stripe account to accept payments and see your
                  dashboard.
                </p>
              </div>
              {subaccountDetails.connectAccountId || connectedStripeAccount ? (
                <CheckCircleIcon
                  size={50}
                  className=" text-primary p-2 flex-shrink-0"
                />
              ) : (
                <Link
                  className="bg-primary py-2 px-4 rounded-md text-white"
                  href={stripeOAuthLink}
                >
                  Start
                </Link>
              )}
            </div>

            {/* ========== SubAccount Details Conformation ========== */}
            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src={subaccountDetails?.subAccountLogo as string}
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p> Fill in all your bussiness details</p>
              </div>
              {allDetailsExist ? (
                <CheckCircleIcon
                  size={50}
                  className="text-primary p-2 flex-shrink-0"
                />
              ) : (
                <Link
                  className="bg-primary py-2 px-4 rounded-md text-white"
                  href={`/agency/${params.subaccountId}/settings`}
                >
                  Start
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
