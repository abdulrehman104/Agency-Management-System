import { Navbar } from "@/components/site-navigation/navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <main className="h-full">
        <Navbar />
        {children}
      </main>
    </ClerkProvider>
  );
};

export default Layout;
