"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Image from "next/image";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { UsersWithAgencySubAccountPermissionsSidebarOptions } from "@/lib/types";
import { deleteUser, getUser } from "@/lib/queries";
import { CustomModal } from "@/components/global/custom-modal";
import { UserForm } from "@/components/forms/user-details";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useModal } from "@/provider/modal-provider";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<UsersWithAgencySubAccountPermissionsSidebarOptions>[] =
  [
    // {/* ========== Column ID ========== */}
    {
      accessorKey: "id",
      header: "",
      cell: () => {
        return null;
      },
    },

    // {/* ========== User Name & Image ========== */}
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const avatarUrl = row.getValue("avatarUrl") as string;
        return (
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 relative flex-none">
              <Image
                src={avatarUrl}
                fill
                className="rounded-full object-cover"
                alt="avatar image"
              />
            </div>
            <span>{row.getValue("name")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "avatarUrl",
      header: "",
      cell: () => {
        return null;
      },
    },

    // {/* ========== User Email ========== */}
    {
      accessorKey: "email",
      header: "Email",
    },

    // {/* ========== User 	Owned Accounts ========== */}
    {
      accessorKey: "SubAccount",
      header: "Owned Accounts",
      cell: ({ row }) => {
        const isAgencyOwner = row.getValue("role") === "AGENCY_OWNER";
        const ownedAccounts = row.original?.Permissions.filter(
          (permission) => permission.access
        );

        if (isAgencyOwner)
          return (
            <div className="flex flex-col items-start">
              <div className="flex flex-col gap-2">
                <Badge className="bg-slate-600 whitespace-nowrap">
                  Agency - {row?.original?.Agency?.name}
                </Badge>
              </div>
            </div>
          );
        return (
          <div className="flex flex-col items-start">
            <div className="flex flex-col gap-2">
              {ownedAccounts?.length ? (
                ownedAccounts.map((account) => (
                  <Badge
                    key={account.id}
                    className="bg-slate-600 w-fit whitespace-nowrap"
                  >
                    Sub Account - {account.SubAccount.name}
                  </Badge>
                ))
              ) : (
                <div className="text-muted-foreground">No Access Yet</div>
              )}
            </div>
          </div>
        );
      },
    },
    // {/* ========== User Role ========== */}
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role: Role = row.getValue("role");
        return (
          <Badge
            className={cn("bg-emerald-500", {
              "bg-emerald-500": role === "AGENCY_OWNER",
              "bg-orange-400": role === "AGENCY_ADMIN",
              "bg-primary": role === "SUBACCOUNT_USER",
              "bg-muted": role === "SUBACCOUNT_GUEST",
            })}
          >
            {role}
          </Badge>
        );
      },
    },

    // {/* ========== Call To Action Button to copy email & update or delete user detail ========== */}
    {
      id: "actions",
      cell: ({ row }) => {
        const rowData = row.original;

        return <CellActions rowData={rowData} />;
      },
    },
  ];

interface CellActionsProps {
  rowData: UsersWithAgencySubAccountPermissionsSidebarOptions;
}

// {/* ========== Call To Action Component ========== */}
export const CellActions = ({ rowData }: CellActionsProps) => {
  const [loading, setLoading] = useState(false);
  const { data, setOpen } = useModal();
  const { toast } = useToast();
  const router = useRouter();

  if (!rowData) return;
  if (!rowData.Agency) return;

  // {/* ========== Ondeleting function For deleting user in DB ========== */}
  const onDelete = async () => {
    setLoading(true);
    await deleteUser(rowData.id);

    toast({
      title: "Deleted User",
      description:
        "The user has been deleted from this agency they no longer have access to the agency",
    });

    setLoading(false);
    router.refresh();
  };
  return (
    <AlertDialog>
      <DropdownMenu>
        {/* ========== DropdownMenuTrigger ========== */}
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        {/* ========== DropdownMenuContent ========== */}
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          {/* ========== DropdownMenuItem For Copy Email ========== */}
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => navigator.clipboard.writeText(rowData?.email)}
          >
            <Copy size={15} /> Copy Email
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* ========== DropdownMenuItem For Edit user Details ========== */}
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => {
              setOpen(
                <CustomModal
                  description="You can change permissions only when the user has an owned subaccount"
                  title="Edit User Details"
                >
                  <UserForm
                    type="agency"
                    id={rowData?.Agency?.id || null}
                    subAccounts={rowData?.Agency?.SubAccount}
                  />
                </CustomModal>,
                async () => {
                  return { user: await getUser(rowData?.id) };
                }
              );
            }}
          >
            <Edit size={15} />
            Edit Details
          </DropdownMenuItem>

          {/* ========== DropdownMenuItem For deleting user in DB except agency owner ========== */}
          {rowData.role == "AGENCY_OWNER" && (
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="flex gap-2">
                <Trash size={15} /> Remove User
              </DropdownMenuItem>
            </AlertDialogTrigger>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ========== Alerk Dialog Box deleting user ========== */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            This action cannot be undone. This will permanently delete the user
            and related data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center">
          <AlertDialogCancel className="mb-2">Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="bg-destructive hover:bg-destructive"
            onClick={onDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
