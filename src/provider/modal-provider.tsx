"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Agency, Contact, Plan, User } from "@prisma/client";
import { PricesList, TicketDetails } from "@/lib/types";

/* ================ Model Data ================  */
export type ModalData = {
  user?: User;
  agency?: Agency;
  contact?: Contact;
  ticket?: TicketDetails[0]
  plans?: {
    defaultPriceId: Plan
    plans: PricesList['data']
  }
};

/* ================ Model Context Types ================  */
type ModalContextType = {
  data: ModalData;
  isOpen: boolean;
  setOpen: (modal: React.ReactNode, fetchData?: () => Promise<any>) => void;
  setClose: () => void;
};

/* ================ Model Provider Props ================  */
interface ModalProviderProps {
  children: React.ReactNode;
}

/* ================ Create Context for Model ================  */
export const ModalContext = createContext<ModalContextType>({
  data: {},
  isOpen: false,
  setOpen: (modal: React.ReactNode, fetchData?: () => Promise<any>) => {},
  setClose: () => {},
});

/* ================ Main Model Logic ================  */
const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ModalData>({});
  const [showingModal, setShowingModal] = useState<React.ReactNode>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const setOpen = async (
    modal: React.ReactNode,
    fetchData?: () => Promise<any>
  ) => {
    if (modal) {
      if (fetchData) {
        setData({ ...data, ...(await fetchData()) });
      }

      setShowingModal(modal);
      setIsOpen(true);
    }
  };

  const setClose = () => {
    setIsOpen(false);
    setData({});
  };

  if (!isMounted) return null;

  /* ================ Custom Model Provider ================  */
  return (
    <ModalContext.Provider value={{ data, setOpen, setClose, isOpen }}>
      {children}
      {showingModal}
    </ModalContext.Provider>
  );
};

/* ================ Initialize UseModel using useContext Hook ================  */
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within the modal provider");
  }
  return context;
};

export default ModalProvider;
