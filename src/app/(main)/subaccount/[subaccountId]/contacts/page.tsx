import { format } from "date-fns/format";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CraeteContactButton } from "./create-contact-btn";
import { BlurPage } from "@/components/global/blur-page";
import { Badge } from "@/components/ui/badge";

import { Contact, SubAccount, Ticket } from "@prisma/client";
import db from "@/lib/db";

type Props = {
  params: { subaccountId: string };
};

export default async function ContactsPage({ params }: Props) {
  // {/* ========== Subaccount Contact Type ========== */}
  type subAccountWithContacts = SubAccount & {
    Contact: (Contact & { Ticket: Ticket[] })[];
  };

  // {/* ========== Get Contact Details in DB ========== */}
  const contacts = (await db.subAccount.findUnique({
    where: {
      id: params.subaccountId,
    },
    include: {
      Contact: {
        include: {
          Ticket: {
            select: {
              value: true,
            },
          },
        },
      },
    },
  })) as subAccountWithContacts;

  const allContacts = contacts.Contact;

  // {/* ========== Ticket Toatal ========== */}
  const formatTotal = (tickets: Ticket[]) => {
    if (!tickets || !tickets.length) return "$0.00";

    const amt = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    });

    const laneAmt = tickets.reduce(
      (sum, ticket) => sum + (Number(ticket?.value) || 0),
      0
    );

    return amt.format(laneAmt);
  };

  return (
    <BlurPage>
      {/* ========== Table Heading ========== */}
      <h1 className="text-4xl p-4">Contacts</h1>

      {/* ========== Create Contact Button ========== */}
      <CraeteContactButton subaccountId={params.subaccountId} />

      {/* ========== Contact Table ========== */}
      <Table>
        {/* ========== Tabel Header ========== */}
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead className="w-[300px]">Email</TableHead>
            <TableHead className="w-[200px]">Active</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
          </TableRow>
        </TableHeader>

        {/* ========== Tabel Body ========== */}
        <TableBody className="font-medium truncate">
          {allContacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>
                <Avatar>
                  <AvatarImage alt="@shadcn" />
                  <AvatarFallback className="bg-primary text-white">
                    {contact.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell>
                {formatTotal(contact.Ticket) === "$0.00" ? (
                  <Badge variant={"destructive"}>Inactive</Badge>
                ) : (
                  <Badge className="bg-emerald-700">Active</Badge>
                )}
              </TableCell>
              <TableCell>{format(contact.createdAt, "MM/dd/yyyy")}</TableCell>
              <TableCell className="text-right">
                {formatTotal(contact.Ticket)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </BlurPage>
  );
}
