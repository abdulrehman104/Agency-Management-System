import db from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { customerId, priceId } = await req.json();

  if (!customerId || !priceId)
    return new NextResponse("Customer Id or price id is missing", {
      status: 400,
    });

  const subscriptionExists = await db.agency.findFirst({
    where: { customerId },
    include: { Subscription: true },
  });

  try {
    if (
      subscriptionExists?.Subscription?.subscritiptionId &&
      subscriptionExists.Subscription.active
    ) {
      // Update the subscription instead of creating one.
      if (!subscriptionExists.Subscription.subscritiptionId) {
        throw new Error(
          "Could not find the subscription Id to update the subscription."
        );
      }
      console.log("Updating the subscription");
      const currentSubscriptionDetails = await stripe.subscriptions.retrieve(
        subscriptionExists.Subscription.subscritiptionId
      );

      const subscription = await stripe.subscriptions.update(
        subscriptionExists.Subscription.subscritiptionId,
        {
          items: [
            {
              id: currentSubscriptionDetails.items.data[0].id,
              deleted: true,
            },
            { price: priceId },
          ],
          expand: ["latest_invoice.payment_intent"],
        }
      );

      // Save the updated subscription in the database
      await db.subscription.update({
        where: { id: subscriptionExists.Subscription.id },
        data: {
          subscritiptionId: subscription.id,
          active: true,
          priceId,
        },
      });

      return NextResponse.json({
        subscriptionId: subscription.id,
        //@ts-ignore
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      });
    } else {
      console.log("Creating a new subscription");
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: priceId,
          },
        ],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });

      // Save the new subscription in the database
      const subscriptionItem = subscription.items.data[0];
      console.log("Plan", subscriptionItem.subscription);
      await db.subscription.create({
        data: {
          customerId,
          subscritiptionId: subscription.id,
          agencyId: subscriptionExists?.id,
          //@ts-ignore
          price: subscriptionItem.plan.amount / 100,
          priceId,
          active: true,
          currentPeriodEndDate: new Date(
            subscription.current_period_end * 1000
          ),
        },
      });
      console.log("Save Data to the DB");

      return NextResponse.json({
        subscriptionId: subscription.id,
        //@ts-ignore
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      });
    }
  } catch (error) {
    console.log("🔴 Error", error);
    return new NextResponse("Internal Server Error", {
      status: 500,
    });
  }
}

// export async function POST(req: Request) {
//   const { customerId, priceId } = await req.json();

//   if (!customerId || !priceId)
//     return new NextResponse("Customer Id or price id is missing", { status: 400 });

//   const subscriptionExists = await db.agency.findFirst({
//     where: { customerId },
//     include: { Subscription: true },
//   });

//   try {
//     if (
//       subscriptionExists?.Subscription?.subscritiptionId &&
//       subscriptionExists.Subscription.active
//     ) {
//       //update the subscription instead of creating one.
//       if (!subscriptionExists.Subscription.subscritiptionId) {
//         throw new Error(
//           "Could not find the subscription Id to update the subscription."
//         );
//       }
//       console.log("Updating the subscription");
//       const currentSubscriptionDetails = await stripe.subscriptions.retrieve(
//         subscriptionExists.Subscription.subscritiptionId
//       );

//       const subscription = await stripe.subscriptions.update(
//         subscriptionExists.Subscription.subscritiptionId,
//         {
//           items: [
//             {
//               id: currentSubscriptionDetails.items.data[0].id,
//               deleted: true,
//             },
//             { price: priceId },
//           ],
//           expand: ["latest_invoice.payment_intent"],
//         }
//       );
//       return NextResponse.json({
//         subscriptionId: subscription.id,
//         //@ts-ignore
//         clientSecret: subscription.latest_invoice.payment_intent.client_secret,
//       });
//     } else {
//       console.log("Createing a sub");
//       const subscription = await stripe.subscriptions.create({
//         customer: customerId,
//         items: [
//           {
//             price: priceId,
//           },
//         ],
//         payment_behavior: "default_incomplete",
//         payment_settings: { save_default_payment_method: "on_subscription" },
//         expand: ["latest_invoice.payment_intent"],
//       });
//       return NextResponse.json({
//         subscriptionId: subscription.id,
//         //@ts-ignore
//         clientSecret: subscription.latest_invoice.payment_intent.client_secret,
//       });
//     }
//   } catch (error) {
//     console.log("🔴 Error", error);
//     return new NextResponse("Internal Server Error", {
//       status: 500,
//     });
//   }
// }