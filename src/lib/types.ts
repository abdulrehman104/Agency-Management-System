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
  getMedia,
  getPipelineDetails,
  getTicketsWithTags,
  getUserPermissions,
} from "./queries";
import db from "./db";

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
