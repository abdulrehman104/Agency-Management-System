import Image from "next/image";
import Link from "next/link";

import { ModelToggle } from "@/components/global/model-toggle";
import { UserButton } from "@clerk/nextjs";

// {/* ========== Landing Page Navbar  ========== */}
export const Navbar = () => {
  return (
    <div className="fixed top-0 right-0 left-0 p-4 flex items-center justify-between z-10">

    {/* ========== Agency Logo  ========== */}
      <aside className="flex items-center gap-2">
        <Image src="/plura-logo.svg" width={40} height={40} alt="plur logo" />
        <span className="text-xl font-bold"> Plura.</span>
      </aside>

    {/* ========== Agency Nav Links  ========== */}
      <nav className="hidden md:block absolute left-[50%] top-[50%] transform translate-x-[-50%] translate-y-[-50%]">
        <ul className="flex items-center justify-center gap-8">
          <Link href={"#"}>Pricing</Link>
          <Link href={"#"}>About</Link>
          <Link href={"#"}>Documentation</Link>
          <Link href={"#"}>Features</Link>
        </ul>
      </nav>

    {/* ========== Agency Login, User Details and Moddle Toogle Button   ========== */}
      <aside className="flex gap-2 items-center">
        <Link
          href={"/agency"}
          className="bg-primary text-white p-2 px-4 rounded-md hover:bg-primary/80"
        >
          Login
        </Link>

        <UserButton />
        <ModelToggle />
      </aside>
    </div>
  );
};
