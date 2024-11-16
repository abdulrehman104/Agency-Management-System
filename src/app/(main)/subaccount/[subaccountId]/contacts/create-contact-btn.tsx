"use client";

import { ContactUserForm } from "@/components/forms/contact-form";
import { CustomModal } from "@/components/global/custom-modal";
import { Button } from "@/components/ui/button";
import { useModal } from "@/provider/modal-provider";

type Props = {
  subaccountId: string;
};

export const CraeteContactButton = ({ subaccountId }: Props) => {
  const { setOpen } = useModal();

  const handleCreateContact = async () => {
    setOpen(
      // {/* ========== Custom Model ========== */}
      <CustomModal
        title="Create Or Update Contact information"
        description="Contacts are like customers."
      >
        {/* ========== Contact Form ========== */}
        <ContactUserForm subaccountId={subaccountId} />
      </CustomModal>
    );
  };

  return <Button onClick={handleCreateContact}>Create Contact</Button>;
};
