"use client";

import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { Unauthenticated, Authenticated } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarLoader } from "react-spinners";
import { Button } from "./ui/button";
import { LayoutDashboard } from "lucide-react";

function Header() {
  const { isLoading } = useStoreUserEffect();
  const path = usePathname();

  function handleClick(section) {
    if(path === "/") {
      const sectionId = document.getElementById(section);
      if(sectionId) {
        sectionId.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  return (
    <header className="fixed top-0 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-50">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between flex-wrap">
        <Link href="/" className="flex items-center gap-1">
          <Image
            src="/Logos/icon1.png"
            alt="Icon"
            width={40}
            height={40}
            className="h-6 w-auto object-contain"
          />
          <Image
            src="/Logos/logo.png"
            alt="Logo"
            width={200}
            height={50}
            className="h-8 w-24 object-contain"
          />
        </Link>
        {path === "/" && (
          <div className="hidden sm:flex flex-row items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-green-500 duration-300"
              onClick={() => handleClick("features")}
            >Features</Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-green-500 duration-300"
              onClick={() => handleClick("how-it-works")}
            >How It Works</Link>
          </div>
        )}
        <div className="flex flex-row items-center gap-2">
          <Unauthenticated>
            <SignInButton>
              <Button variant="ghost" className="cursor-pointer">Sign In</Button>
            </SignInButton>
            <SignUpButton>
              <Button className="bg-green-500 hover:bg-green-600 duration-300 border-none cursor-pointer">Sign Up</Button>
            </SignUpButton>
          </Unauthenticated>
          <Authenticated>
            <Link
              href="/dashboard"
            >
              <Button
                variant="outline"
                className="hidden md:inline-flex items-center hover:text-green-500 hover:border-green-600 duration-300 cursor-pointer gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link
              href="/dashboard"
            >
              <Button
                variant="outline"
                className="md:hidden hover:text-green-500 hover:border-green-600 duration-300 cursor-pointer w-10 h-10 p-0"
              >
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </Link>
            <UserButton />
          </Authenticated>
        </div>
      </nav>
      {isLoading && <BarLoader width={"100%"} color="#36d7b7" />}
    </header>
  );
}

export default Header;