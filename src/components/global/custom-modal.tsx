"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/provider/modal-provider";

//  ============================ Types for Custom Model ============================
type Props = {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
};

export const CustomModal = ({
  title,
  description,
  children,
  defaultOpen,
}: Props) => {
  const { isOpen, setClose } = useModal(); // Get modal state and close handler from custom hook

  return (
//  ============================ Create Custom Model using Dilog Component ============================
    <Dialog open={isOpen || defaultOpen} onOpenChange={setClose}>
      <DialogContent className="overflow-scroll md:max-h-[700px] md:h-fit h-screen bg-card">
        <DialogHeader className="pt-8 text-left">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          {children}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
