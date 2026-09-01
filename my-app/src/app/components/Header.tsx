"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Lock, Menu, ReceiptText, Settings, ShieldCheck, Utensils, X } from "lucide-react";
import { useState } from "react";
import useAuthContext from "../hooks/useAuth";

export default function Header() {
  const { user, loading, logout } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#efd9bd] bg-[#fffdf8]/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-2xl font-black text-[#251611]"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d9472b] text-lg font-black text-white shadow-md">
            P
          </span>
          <span className="tracking-tight">Park Paradise</span>
        </Link>


        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/menu"
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-[#765f55] hover:bg-[#fff1d5] hover:text-[#d9472b]"
          >
            <Utensils className="h-4 w-4" /> Menu
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-[#765f55] hover:bg-[#fff1d5] hover:text-[#d9472b]"
          >
            <ReceiptText className="h-4 w-4" /> My Orders
          </Link>
          {user && (
            <Link
              href="/favourites"
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-[#765f55] hover:bg-[#fff1d5] hover:text-[#d9472b]"
            >
              <Heart className="h-4 w-4" /> Favourites
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full bg-[#fff1d5] px-4 py-2 text-sm font-bold text-[#d9472b] shadow-sm hover:bg-[#ffe3b3]"
            >
              <ShieldCheck className="h-4 w-4" /> Admin Portal
            </Link>
          )}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-full bg-[#efd9bd]" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-[#efd9bd] bg-[#fffdf8] p-1.5 pr-3 transition hover:bg-[#fff1d5]"
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-[#d9472b] bg-[#fff1d5] flex items-center justify-center text-xs font-black text-[#d9472b] shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || "User Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{(user.name || "U")[0].toUpperCase()}</span>
                  )}
                </div>
                <span className="text-xs font-bold text-[#251611] max-w-[100px] truncate">
                  {user.name?.split(" ")[0] || "Account"}
                </span>
              </button>


              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#efd9bd] bg-[#fffdf8] p-2 shadow-2xl">
                  <div className="border-b border-[#efd9bd] px-3 py-2">
                    <p className="text-xs font-black text-[#251611] truncate">{user.name}</p>
                    <span className="inline-block rounded-md bg-[#fff1d5] px-2 py-0.5 text-[10px] font-black uppercase text-[#d9472b]">
                      {user.role}
                    </span>
                  </div>
                  <div className="mt-1 space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-xl px-3 py-2 text-xs font-bold text-[#765f55] hover:bg-[#fff1d5] hover:text-[#d9472b]"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-xl px-3 py-2 text-xs font-bold text-[#765f55] hover:bg-[#fff1d5] hover:text-[#d9472b]"
                    >
                      My Orders
                    </Link>
                    <Link
                      href="/favourites"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-xl px-3 py-2 text-xs font-bold text-[#765f55] hover:bg-[#fff1d5] hover:text-[#d9472b]"
                    >
                      My Favourites
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="block rounded-xl bg-[#fff1d5] px-3 py-2 text-xs font-black text-[#d9472b]"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="zaika-button px-5 py-2 text-xs font-bold shadow-sm"
              >
                Sign In
              </Link>
              <Link
                href="/admin/login"
                className="rounded-full border border-[#efd9bd] bg-[#fffdf8] px-3.5 py-2 text-xs font-bold text-[#765f55] hover:bg-[#fff1d5] hover:text-[#251611]"
              >
                Admin
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="rounded-2xl border border-[#efd9bd] p-2 text-[#251611] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav className="border-t border-[#efd9bd] bg-[#fffdf8] p-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm font-bold text-[#251611]">
            <Link
              href="/menu"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2 hover:bg-[#fff1d5]"
            >
              Today's Menu
            </Link>
            <Link
              href="/orders"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2 hover:bg-[#fff1d5]"
            >
              My Orders
            </Link>
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2 hover:bg-[#fff1d5]"
                >
                  My Profile
                </Link>
                <Link
                  href="/favourites"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2 hover:bg-[#fff1d5]"
                >
                  My Favourites
                </Link>

                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl bg-[#fff1d5] px-3 py-2 font-black text-[#d9472b]"
                  >
                    Restaurant Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="rounded-xl px-3 py-2 text-left font-bold text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="zaika-button text-center py-2.5 text-xs"
                >
                  Sign In / Register
                </Link>
                <Link
                  href="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-[#efd9bd] bg-white py-2.5 text-center text-xs font-bold text-[#251611]"
                >
                  Admin Portal
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

