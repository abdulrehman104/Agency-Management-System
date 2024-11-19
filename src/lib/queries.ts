"use server";

import { clerkClient, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { v4 } from "uuid";

import {
  Agency,
  Lane,
  Plan,
  Prisma,
  Role,
  SubAccount,
  Tag,
  Ticket,
  User,
} from "@prisma/client";
import db from "./db";
import { CreateMediaType } from "./types";

// {/* =============================================== Agency Route Related Queries  =============================================== */}

// {/* ========== verifyAndAcceptInvitation ========== */}
// This function do many things including:
// 1. If the user is invited to our agency and the invitation request is PENDING.
// 2. If the request is PENDING then, it creates a new team user for the agency, & save you activity logs.
// 3. After that it deletes the invitation to the DB & Returns the agency ID or null if no invitation is found.
export const verifyAndAcceptInvitation = async () => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const invitationExists = await db.invitation.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
      status: "PENDING",
    },
  });

  if (invitationExists) {
    const userDetails = await createTeamUser(invitationExists.agencyId, {
      email: invitationExists.email,
      agencyId: invitationExists.agencyId,
      avatarUrl: user.imageUrl,
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: invitationExists.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await saveActivityLogsNotification({
      agencyId: invitationExists?.agencyId,
      description: `Joined`,
      subaccountId: undefined,
    });

    if (userDetails) {
      await clerkClient.users.updateUserMetadata(user.id, {
        privateMetadata: {
          role: userDetails.role || "SUBACCOUNT_USER",
        },
      });

      await db.invitation.delete({
        where: { email: userDetails.email },
      });

      return userDetails.agencyId;
    } else return null;
  } else {
    const agency = await db.user.findUnique({
      where: {
        email: user.emailAddresses[0].emailAddress,
      },
    });
    return agency ? agency.agencyId : null;
  }
};

// Adds a new user to an agency, except if the user is an "AGENCY_OWNER." Saves the user details in the database and returns the response.
export const createTeamUser = async (agencyId: string, user: User) => {
  if (user.role === "AGENCY_OWNER") return null;
  const response = await db.user.create({ data: { ...user } });
  return response;
};

// Logs activities related to the agency or subaccount. Creates a notification for actions performed by the user, like joining an agency or other activities, and saves it in the database.
export const saveActivityLogsNotification = async ({
  agencyId,
  description,
  subaccountId,
}: {
  agencyId?: string;
  description: string;
  subaccountId?: string;
}) => {
  const authUser = await currentUser();
  let userData;
  if (!authUser) {
    const response = await db.user.findFirst({
      where: {
        Agency: {
          SubAccount: {
            some: { id: subaccountId },
          },
        },
      },
    });
    if (response) {
      userData = response;
    }
  } else {
    userData = await db.user.findUnique({
      where: { email: authUser?.emailAddresses[0].emailAddress },
    });
  }

  if (!userData) {
    console.log("Could not find a user");
    return;
  }

  let foundAgencyId = agencyId;
  if (!foundAgencyId) {
    if (!subaccountId) {
      throw new Error(
        "You need to provide atleast an agency Id or subaccount Id"
      );
    }
    const response = await db.subAccount.findUnique({
      where: { id: subaccountId },
    });
    if (response) foundAgencyId = response.agencyId;
  }
  if (subaccountId) {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
        SubAccount: {
          connect: { id: subaccountId },
        },
      },
    });
  } else {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
      },
    });
  }
};

// {/* ========== getAuthUserDetails ========== */}
// The getAuthUserDetails function retrieves detailed information about the current authenticated user, including:

// User-specific details from the user table.
// The user's associated Agency and its related Sidebar Options.
// Any SubAccounts and their Sidebar Options.
// The user's Permissions.

export const getAuthUserDetails = async () => {
  const user = await currentUser();
  if (!user) {
    return;
  }

  const userData = await db.user.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
    include: {
      Agency: {
        include: {
          SidebarOption: true,
          SubAccount: {
            include: {
              SidebarOption: true,
            },
          },
        },
      },
      Permissions: true,
    },
  });

  return userData;
};

// {/* ========== updateAgencyDetails ========== */}
// This updateAgencyDetails function updates the agency details.
export const updateAgencyDetails = async (
  agencyId: string,
  agencyDetails: Partial<Agency>
) => {
  const response = await db.agency.update({
    where: { id: agencyId },
    data: { ...agencyDetails },
  });
  return response;
};

// {/* ========== deleteAgency ========== */}
// This function delete an existing Agency in the DB.

export const deleteAgency = async (agencyId: string) => {
  const response = await db.agency.delete({
    where: {
      id: agencyId,
    },
  });
  return response;
};

// {/* ========== initUser ========== */}
// This initUser function create or update the user in our DB and also assign the role according to user role.
export const initUser = async (newUser: Partial<User>) => {
  const user = await currentUser();
  if (!user) return;

  const userData = await db.user.upsert({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
    update: newUser,
    create: {
      id: user.id,
      avatarUrl: user.imageUrl,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName} ${user.lastName}`,
      role: newUser.role || "SUBACCOUNT_USER",
    },
  });

  await clerkClient.users.updateUserMetadata(user.id, {
    privateMetadata: {
      role: newUser.role || "SUBACCOUNT_USER",
    },
  });

  return userData;
};

// {/* ========== upsertAgency ========== */}
// THis upsertAgency function create a agency in our DB and also add the SidebarOption for Agency Dashbard.
export const upsertAgency = async (agency: Agency, price?: Plan) => {
  if (!agency.companyEmail) return null;
  try {
    const agencyDetails = await db.agency.upsert({
      where: {
        id: agency.id,
      },
      update: agency,
      create: {
        users: {
          connect: { email: agency.companyEmail },
        },
        ...agency,
        SidebarOption: {
          create: [
            {
              name: "Dashboard",
              icon: "category",
              link: `/agency/${agency.id}`,
            },
            {
              name: "Launchpad",
              icon: "clipboardIcon",
              link: `/agency/${agency.id}/launchpad`,
            },
            {
              name: "Sub Accounts",
              icon: "person",
              link: `/agency/${agency.id}/all-subaccounts`,
            },
            {
              name: "Team",
              icon: "shield",
              link: `/agency/${agency.id}/team`,
            },
            {
              name: "Billing",
              icon: "payment",
              link: `/agency/${agency.id}/billing`,
            },
            {
              name: "Settings",
              icon: "settings",
              link: `/agency/${agency.id}/settings`,
            },
          ],
        },
      },
    });

    return agencyDetails;
  } catch (error) {
    console.log("There is an error to upsert agency data.", error);
  }
};

// {/* ========== getNotificationAndUser ========== */}
// This function get user and all notification in our DB.
export const getNotificationAndUser = async (agencyId: string) => {
  try {
    const response = await db.notification.findMany({
      where: { agencyId },
      include: { User: true },
      orderBy: {
        createdAt: "desc",
      },
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

// {/* ========== upsertSubAccount ========== */}
// upsertSubAccount, This function create and update the subaccount in the DB, & also add restriction, only AGENCY_OWNER create a subAccount.
export const upsertSubAccount = async (subAccount: SubAccount) => {
  if (!subAccount.companyEmail) return null;

  const agencyOwner = await db.user.findFirst({
    where: {
      Agency: {
        id: subAccount.agencyId,
      },
      role: "AGENCY_OWNER",
    },
  });

  if (!agencyOwner) return console.log("🔴Erorr could not create subaccount");

  const permissionId = v4();

  const response = await db.subAccount.upsert({
    where: { id: subAccount.id },
    update: subAccount,
    create: {
      ...subAccount,
      Permissions: {
        create: {
          access: true,
          email: agencyOwner.email,
          id: permissionId,
        },
        connect: {
          subAccountId: subAccount.id,
          id: permissionId,
        },
      },
      Pipeline: {
        create: { name: "Lead Cycle" },
      },
      SidebarOption: {
        create: [
          {
            name: "Dashboard",
            icon: "category",
            link: `/subaccount/${subAccount.id}`,
          },
          {
            name: "Launchpad",
            icon: "clipboardIcon",
            link: `/subaccount/${subAccount.id}/launchpad`,
          },
          {
            name: "Media",
            icon: "database",
            link: `/subaccount/${subAccount.id}/media`,
          },
          {
            name: "Pipelines",
            icon: "flag",
            link: `/subaccount/${subAccount.id}/pipelines`,
          },
          {
            name: "Funnels",
            icon: "pipelines",
            link: `/subaccount/${subAccount.id}/funnels`,
          },
          {
            name: "Automations",
            icon: "chip",
            link: `/subaccount/${subAccount.id}/automations`,
          },
          {
            name: "Contacts",
            icon: "person",
            link: `/subaccount/${subAccount.id}/contacts`,
          },
          {
            name: "Settings",
            icon: "settings",
            link: `/subaccount/${subAccount.id}/settings`,
          },
        ],
      },
    },
  });

  return response;
};

// {/* ========== getUserPermissions ========== */}
export const getUserPermissions = async (userId: string) => {
  const response = await db.user.findUnique({
    where: { id: userId },
    select: { Permissions: { include: { SubAccount: true } } },
  });
  return response;
};

// {/* ========== changeUserPermissions ========== */}
export const changeUserPermissions = async (
  permissionId: string | undefined,
  userEmail: string,
  subAccountId: string,
  permission: boolean
) => {
  try {
    const response = await db.permissions.upsert({
      where: { id: permissionId },
      update: { access: permission },
      create: {
        access: permission,
        email: userEmail,
        subAccountId: subAccountId,
      },
    });
    return response;
  } catch (error) {
    console.log("🔴Could not change persmission", error);
  }
};

// {/* ========== updateUser ========== */}
export const updateUser = async (user: Partial<User>) => {
  const response = await db.user.update({
    where: { email: user.email },
    data: { ...user },
  });

  await clerkClient.users.updateUserMetadata(response.id, {
    privateMetadata: {
      role: user.role || "SUBACCOUNT_USER",
    },
  });

  return response;
};

// {/* =============================================== All SubAccount Route Actions =============================================== */}

// {/* ========== getSubaccountDetails ========== */}
export const getSubaccountDetails = async (subaccountId: string) => {
  const response = await db.subAccount.findUnique({
    where: {
      id: subaccountId,
    },
  });
  return response;
};

// {/* ========== deleteSubAccount ========== */}
export const deleteSubAccount = async (subaccountId: string) => {
  const response = await db.subAccount.delete({
    where: {
      id: subaccountId,
    },
  });
  return response;
};

// {/* ========== getUser ========== */}
export const getUser = async (id: string) => {
  const user = await db.user.findUnique({
    where: {
      id,
    },
  });

  return user;
};

// {/* ========== delete user on DB & clerk ========== */}
export const deleteUser = async (userId: string) => {
  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: {
      role: undefined,
    },
  });
  const deletedUser = await db.user.delete({ where: { id: userId } });

  return deletedUser;
};

// {/* =============================================== Team Route Actions =============================================== */}

// {/* ========== sendInvitation ========== */}
export const sendInvitation = async (
  agencyId: string,
  email: string,
  role: Role
) => {
  const resposne = await db.invitation.create({
    data: { email, agencyId, role },
  });

  console.log("Data save to the DB");

  try {
    console.log("Data save to the DB");
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: process.env.NEXT_PUBLIC_URL,
      publicMetadata: {
        // throughInvitation: true,
        role,
      },
    });
  } catch (error) {
    console.log("Could not send invitation", error);
  }

  return resposne;
};

// {/* =============================================== SubAccount Route Related Queries  =============================================== */}

// {/* ========== Get Media Files ========== */}
export const getMedia = async (subaccountId: string) => {
  const mediaFile = await db.subAccount.findUnique({
    where: {
      id: subaccountId,
    },
    include: { Media: true },
  });
  return mediaFile;
};

// {/* ========== Create Media Files ========== */}
export const createMedia = async (
  subaccountId: string,
  mediaFile: CreateMediaType
) => {
  const response = await db.media.create({
    data: {
      link: mediaFile.link,
      name: mediaFile.name,
      subAccountId: subaccountId,
    },
  });

  return response;
};

// {/* ========== Delete Media Files ========== */}
export const deleteMedia = async (mediaId: string) => {
  const response = await db.media.delete({
    where: {
      id: mediaId,
    },
  });
  return response;
};

// {/* ========== Create & Upsert Contact ========== */}
export const upsertContact = async (
  contact: Prisma.ContactUncheckedCreateInput
) => {
  const response = await db.contact.upsert({
    where: { id: contact.id || v4() },
    update: contact,
    create: contact,
  });
  return response;
};

// {/* ========== Get Piplines Details ========== */}
export const getPipelineDetails = async (pipelineId: string) => {
  const response = await db.pipeline.findUnique({
    where: {
      id: pipelineId,
    },
  });

  return response;
};

// {/* ========== Get Lane Details with Ticket Tags Assigned & Customer ========== */}
export const getLanesWithTicketAndTags = async (pipelineId: string) => {
  const response = await db.lane.findMany({
    where: {
      pipelineId,
    },
    orderBy: { order: "asc" },
    include: {
      Tickets: {
        orderBy: {
          order: "asc",
        },
        include: {
          Tags: true,
          Assigned: true,
          Customer: true,
        },
      },
    },
  });
  return response;
};

// {/* ========== Create & Upsert Pipline ========== */}
export const upsertPipeline = async (
  pipeline: Prisma.PipelineUncheckedCreateWithoutLaneInput
) => {
  const response = await db.pipeline.upsert({
    where: { id: pipeline.id || v4() },
    update: pipeline,
    create: pipeline,
  });

  return response;
};

// {/* ========== Update Lane Orders ========== */}
export const updateLanesOrder = async (lanes: Lane[]) => {
  try {
    const updateTrans = lanes.map((lane) =>
      db.lane.update({
        where: {
          id: lane.id,
        },
        data: {
          order: lane.order,
        },
      })
    );

    await db.$transaction(updateTrans);
    console.log("🟢 Done reordered 🟢");
  } catch (error) {
    console.log(error, "ERROR UPDATE LANES ORDER");
  }
};

// {/* ========== Update Ticket Orders ========== */}
export const updateTicketsOrder = async (tickets: Ticket[]) => {
  try {
    const updateTrans = tickets.map((ticket) =>
      db.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          order: ticket.order,
          laneId: ticket.laneId,
        },
      })
    );

    await db.$transaction(updateTrans);
    console.log("🟢 Done reordered 🟢");
  } catch (error) {
    console.log(error, "🔴 ERROR UPDATE TICKET ORDER");
  }
};

// {/* ========== Delete Pipline in our DB ========== */}
export const deletePipeline = async (pipelineId: string) => {
  const response = await db.pipeline.delete({
    where: {
      id: pipelineId,
    },
  });
  return response;
};

// {/* ========== Create & Update Lane ========== */}
export const upsertLane = async (lane: Prisma.LaneUncheckedCreateInput) => {
  let order: number;

  if (!lane.order) {
    const lanes = await db.lane.findMany({
      where: {
        pipelineId: lane.pipelineId,
      },
    });

    order = lanes.length;
  } else {
    order = lane.order;
  }

  const response = await db.lane.upsert({
    where: { id: lane.id || v4() },
    update: lane,
    create: { ...lane, order },
  });

  return response;
};

// {/* ========== Delete Lane ========== */}
export const deleteLane = async (laneId: string) => {
  const resposne = await db.lane.delete({ where: { id: laneId } });
  return resposne;
};

// {/* ========== Get Ticket with Tags ========== */}
export const getTicketsWithTags = async (pipelineId: string) => {
  const response = await db.ticket.findMany({
    where: {
      Lane: {
        pipelineId,
      },
    },
    include: { Tags: true, Assigned: true, Customer: true },
  });
  return response;
};

// {/* ========== Get Ticket with All Relation (just for Type Peropse) ========== */}
export const _getTicketsWithAllRelations = async (laneId: string) => {
  const response = await db.ticket.findMany({
    where: { laneId: laneId },
    include: {
      Assigned: true,
      Customer: true,
      Lane: true,
      Tags: true,
    },
  });
  return response;
};

// {/* ========== Get Sub Account Team Members ========== */}
export const getSubAccountTeamMembers = async (subaccountId: string) => {
  const subaccountUsersWithAccess = await db.user.findMany({
    where: {
      Agency: {
        SubAccount: {
          some: {
            id: subaccountId,
          },
        },
      },
      role: "SUBACCOUNT_USER",
      Permissions: {
        some: {
          subAccountId: subaccountId,
          access: true,
        },
      },
    },
  });
  return subaccountUsersWithAccess;
};

// {/* ========== Search Contacts ========== */}
export const searchContacts = async (searchTerms: string) => {
  const response = await db.contact.findMany({
    where: {
      name: {
        contains: searchTerms,
      },
    },
  });
  return response;
};

// {/* ========== Create & Update Ticket ========== */}
export const upsertTicket = async (
  ticket: Prisma.TicketUncheckedCreateInput,
  tags: Tag[]
) => {
  let order: number;
  if (!ticket.order) {
    const tickets = await db.ticket.findMany({
      where: { laneId: ticket.laneId },
    });
    order = tickets.length;
  } else {
    order = ticket.order;
  }

  const response = await db.ticket.upsert({
    where: {
      id: ticket.id || v4(),
    },
    update: { ...ticket, Tags: { set: tags } },
    create: { ...ticket, Tags: { connect: tags }, order },
    include: {
      Assigned: true,
      Customer: true,
      Tags: true,
      Lane: true,
    },
  });

  return response;
};

// {/* ========== Delete Ticket ========== */}
export const deleteTicket = async (ticketId: string) => {
  const response = await db.ticket.delete({
    where: {
      id: ticketId,
    },
  });

  return response;
};

// {/* ========== Upsert Ticket ========== */}
export const upsertTag = async (
  subaccountId: string,
  tag: Prisma.TagUncheckedCreateInput
) => {
  const response = await db.tag.upsert({
    where: { id: tag.id || v4(), subAccountId: subaccountId },
    update: tag,
    create: { ...tag, subAccountId: subaccountId },
  });

  return response;
};

// {/* ========== Get Tags for subaccount ========== */}
export const getTagsForSubaccount = async (subaccountId: string) => {
  const response = await db.subAccount.findUnique({
    where: { id: subaccountId },
    select: { Tags: true },
  });
  return response;
};

// {/* ========== Delete Tags ========== */}
export const deleteTag = async (tagId: string) => {
  const response = await db.tag.delete({ where: { id: tagId } });
  return response;
};
