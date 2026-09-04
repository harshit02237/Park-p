"use client";

import Link from "next/link";
import { CreditCard, QrCode, ShieldCheck, ShoppingBag } from "lucide-react";
import useAuthContext from "../hooks/useAuth";

export default function Footer() {
  const { user } = useAuthContext();

  return (
    <footer className="mt-16 border-t border-[#efd9bd] bg-[#fffdf8]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between border-b border-[#efd9bd] pb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#d9472b] text-base font-black text-white shadow-sm">
                P
              </span>
              <span className="text-2xl font-black text-[#251611]">Park Paradise</span>
            </div>
            <p className="mt-2 text-xs text-[#765f55] max-w-sm leading-relaxed">
              Authentic restaurant recipes prepared fresh with rich spices, delivered warm to your doorstep.
            </p>
          </div>

          {/* Payment Methods supported */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#765f55] mb-2.5">
              Accepted Payment Modes
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-[#765f55]">
              <span className="flex items-center gap-1.5 rounded-xl border border-[#efd9bd] bg-[#fff8ed] px-3 py-1.5 text-[#251611]">
                <ShoppingBag className="h-3.5 w-3.5 text-[#d9472b]" /> Cash on Delivery (Active)
              </span>
              <span className="flex items-center gap-1.5 rounded-xl border border-[#efd9bd] bg-[#f8f5f2] px-3 py-1.5 opacity-75">
                <QrCode className="h-3.5 w-3.5 text-[#765f55]" /> UPI & QR Scan <span className="rounded bg-[#efd9bd] px-1 py-0.2 text-[9px] font-black uppercase text-[#765f55]">Soon</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-xl border border-[#efd9bd] bg-[#f8f5f2] px-3 py-1.5 opacity-75">
                <CreditCard className="h-3.5 w-3.5 text-[#765f55]" /> Credit / Debit Card <span className="rounded bg-[#efd9bd] px-1 py-0.2 text-[9px] font-black uppercase text-[#765f55]">Soon</span>
              </span>
            </div>
          </div>
        </div>


        <div className="mt-6 flex flex-col gap-4 text-xs font-semibold text-[#765f55] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Park Paradise. All rights reserved.</p>

          <div className="flex flex-wrap gap-4">
            {user?.role === "admin" ? (
              <>
                <Link href="/admin" className="flex items-center gap-1 text-[#d9472b] hover:underline font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" /> Kitchen Dashboard
                </Link>
                <Link href="/profile" className="hover:text-[#d9472b]">
                  Admin Settings
                </Link>
              </>
            ) : (
              <>
                <Link href="/menu" className="hover:text-[#d9472b]">Today's Menu</Link>
                <Link href="/orders" className="hover:text-[#d9472b]">Order Tracking</Link>
                <Link href="/login" className="hover:text-[#d9472b]">Customer Login</Link>
                <Link href="/admin/login" className="flex items-center gap-1 text-[#d9472b] hover:underline font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" /> Restaurant Admin Portal
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}


