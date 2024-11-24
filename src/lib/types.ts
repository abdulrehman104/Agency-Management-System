import {
  Contact,
  Lane,
  Notification,
  Prisma,
  Role,
  Tag,
  Ticket,
  User,
} from "@prisma/client";

import {
  _getTicketsWithAllRelations,
  getAuthUserDetails,
  getFunnels,
  getMedia,
  getPipelineDetails,
  getTicketsWithTags,
  getUserPermissions,
} from "./queries";

import db from "./db";
import Stripe from "stripe";
import { z } from "zod";

// {/* ========== NotificationWithUser ========== */}
export type NotificationWithUser =
  | ({
      User: {
        id: string;
        name: string;
        avatarUrl: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        role: Role;
        agencyId: string | null;
      };
    } & Notification)[]
  | undefined;

// {/* ========== UserWithPermissionsAndSubAccounts ========== */}
export type UserWithPermissionsAndSubAccounts = Prisma.PromiseReturnType<
  typeof getUserPermissions
>;

// {/* ========== AuthUserWithAgencySigebarOptionsSubAccounts ========== */}
export type AuthUserWithAgencySigebarOptionsSubAccounts =
  Prisma.PromiseReturnType<typeof getAuthUserDetails>;

// {/* ========== __getUsersWithAgencySubAccountPermissionsSidebarOptions ========== */}
const __getUsersWithAgencySubAccountPermissionsSidebarOptions = async (
  agencyId: string
) => {
  return await db.user.findFirst({
    where: { id: agencyId },
    include: {
      Agency: { include: { SubAccount: true } },
      Permissions: { include: { SubAccount: true } },
    },
  });
};

// {/* ========== UsersWithAgencySubAccountPermissionsSidebarOptions ========== */}
export type UsersWithAgencySubAccountPermissionsSidebarOptions =
  Prisma.PromiseReturnType<
    typeof __getUsersWithAgencySubAccountPermissionsSidebarOptions
  >;

// {/* ========== Get Media Files ========== */}
export type GetMediaFiles = Prisma.PromiseReturnType<typeof getMedia>;

// {/* ========== Create Media Files ========== */}
export type CreateMediaType = Prisma.MediaCreateWithoutSubaccountInput;

// {/* ========== Lane Details with Ticket Tags & Assigned ========== */}
export type TicketAndTags = Ticket & {
  Tags: Tag[];
  Assigned: User | null;
  Customer: Contact | null;
};

export type LaneDetail = Lane & {
  Tickets: TicketAndTags[];
};

export type PipelineDetailsWithLanesCardsTagsTickets = Prisma.PromiseReturnType<
  typeof getPipelineDetails
>;

export type TicketWithTags = Prisma.PromiseReturnType<
  typeof getTicketsWithTags
>;

export type TicketDetails = Prisma.PromiseReturnType<
  typeof _getTicketsWithAllRelations
>;

export const ContactUserFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email(),
})

export type Address = {
  city: string;
  country: string;
  line1: string;
  postal_code: string;
  state: string;
};

export type ShippingInfo = {
  address: Address;
  name: string;
};

export type StripeCustomerType = {
  email: string;
  name: string;
  shipping: ShippingInfo;
  address: Address;
};

export type PricesList = Stripe.ApiList<Stripe.Price>;

// {/* ========== Funnel SubAccount Types ========== */}
export type FunnelsForSubAccount = Prisma.PromiseReturnType<
  typeof getFunnels
>[0];

// {/* ========== Upsert Funnel Types ========== */}
export type UpsertFunnelPage = Prisma.FunnelPageCreateWithoutFunnelInput;
