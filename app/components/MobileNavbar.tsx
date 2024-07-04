"use client";
import React, { useEffect, useState } from "react";
import {
  House,
  CircleUser,
  CirclePlus,
  LogOut,
  LogIn,
  UserPlus,
  Users,
  MapPinned,
  ArrowRightLeft,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { isMobile } from "react-device-detect";
import { useUserStore } from "@/context/AuthContext";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [Mobile, setIsMobile] = useState(false);
  const loggedIn = useUserStore((state: any) => state.loggedIn);
  const isAdmin = useUserStore((state: any) => state.user.admin);
  const updateLogin = useUserStore((state: any) => state.updateLogin);
  const updateUser = useUserStore((state: any) => state.updateUser);
  const user = useUserStore((state: any) => state.user);
  
  useEffect(() => {
    setIsMobile(isMobile);
  });

  const logout = async () => {
    try {
      await fetch("http://localhost:8080/api/logout", {
        credentials: "include",
        method: "POST",
      });
      updateLogin({ loggedIn: false });
      updateUser({ admin: false, username: "" });
      router.push("/");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <div>
      {loggedIn == true ? (
        <nav className="border-t-2 border-black flex flex-row items-center justify-between">
          <Link
            href="/"
            className="p-4 flex flex-col items-center text-gray-500"
          >
            <House size={24} />
            <p>Home</p>
          </Link>
          <Link
            href="/profile"
            className="p-4 flex flex-col items-center text-gray-500"
          >
            <CircleUser size={24} />
            <p>Profile</p>
          </Link>
          {isAdmin == true ? (
            <div className="flex flex-row items-center justify-between">
              <Link
                href="/reports"
                className="p-4 flex flex-col items-center text-gray-500"
              >
                <Users size={24} />
                <p>Admin</p>
              </Link>
            </div>
          ) : (
            <div></div>
          )}
          <Link
            href="/report"
            className="p-4 flex flex-col items-center text-gray-500"
          >
            <CirclePlus size={24} />
            <p>Upload</p>
          </Link>
          <Link
            href="/profile/swap"
            className="p-4 flex flex-col items-center text-gray-500"
          >
            <ArrowRightLeft size={24} />
            <p>Swap</p>
          </Link>
          <button
            onClick={logout}
            className="p-4 flex flex-col items-center text-gray-500"
          >
            <LogOut size={24} />
            <p>Logout</p>
          </button>
        </nav>
      ) : (
        <nav className="border-t-2 border-black flex flex-row items-center justify-between">
          <Link
            href="/login"
            className="p-4 flex flex-col items-center text-gray-500"
          >
            <LogIn size={24} />
            <p>Login</p>
          </Link>
          <Link
            href="/register"
            className="p-4 flex flex-col items-center text-gray-500"
          >
            <UserPlus size={24} />
            <p>Register</p>
          </Link>
        </nav>
      )}
    </div>
  );
};

export default Navbar;
