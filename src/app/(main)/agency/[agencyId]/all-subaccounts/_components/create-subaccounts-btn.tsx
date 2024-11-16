"use client";

import { PlusCircleIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { Agency, AgencySidebarOption, SubAccount, User } from "@prisma/client";
import { SubAccountForm } from "@/components/forms/subAccount-details";
import { CustomModal } from "@/components/global/custom-modal";
import { Button } from "@/components/ui/button";
import { useModal } from "@/provider/modal-provider";

type Props = {
  user: User & {
    Agency:
      | (
          | Agency
          | (null & {
              SubAccount: SubAccount[];
              SideBarOption: AgencySidebarOption[];
            })
        )
      | null;
  };
  id: string;
  className: string;
};

export const CreateSubaccountButton = ({ className, id, user }: Props) => {
  const { setOpen } = useModal();
  const agencyDetails = user.Agency;

  if (!agencyDetails) return;

  return (
    <Button
      className={twMerge("w-full flex gap-4", className)}
      onClick={() => {
        setOpen(
          <CustomModal
            title="Create a Subaccount"
            description="You can switch bettween"
          >
            <SubAccountForm
              agencyDetails={agencyDetails}
              userId={user.id}
              userName={user.name}
            />
          </CustomModal>
        );
      }}
    >
      <PlusCircleIcon size={15} />
      Create Sub Account
    </Button>
  );
};
