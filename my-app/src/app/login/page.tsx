"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { ArrowRight, Check, Heart, Lock, Mail, MapPin, ShieldCheck, ShoppingBag, Sparkles, User, UtensilsCrossed, Zap } from "lucide-react";
import { api } from "../lib/api";
import { useAuthContext } from "../lib/auth";

export default function LoginPage() {
  const { loginWithToken } = useAuthContext();
  const [activeTab, setActiveTab] = useState<"customer" | "admin">("customer");
  const [customerMode, setCustomerMode] = useState<"login" | "register">("login");

  // Customer form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");

  // Admin form state
  const [adminEmail, setAdminEmail] = useState("admin@zaika.com");
  const [adminPassword, setAdminPassword] = useState("admin123");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      const tab = params.get("tab");
      if (err) {
        setError(decodeURIComponent(err));
        window.history.replaceState(null, "", window.location.pathname);
      }
      if (tab === "admin" || window.location.pathname.includes("/admin")) {
        setActiveTab("admin");
      }
    }
  }, []);


  const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:5004";
  const customerGoogleUrl = `${apiBase}/api/auth/google?role=customer`;
  const adminGoogleUrl = `${apiBase}/api/auth/google?role=admin`;

  const handleCustomerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (customerMode === "register") {
        const res = await api.post("/auth/customer/register", {
          name: customerName,
          email: customerEmail,
          password: customerPassword,
        });
        setSuccess("Account created successfully! Redirecting...");
        loginWithToken(res.data.token, "/");
      } else {
        const res = await api.post("/auth/customer/login", {
          email: customerEmail,
          password: customerPassword,
        });
        setSuccess("Welcome back! Redirecting...");
        loginWithToken(res.data.token, "/");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          (err?.message === "Network Error"
            ? "Cannot reach backend server. Please verify backend is running."
            : "Authentication failed. Please check your credentials.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoCustomer = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/customer/quick-login");
      setSuccess("Demo customer signed in! Redirecting...");
      loginWithToken(res.data.token, "/");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          (err?.message === "Network Error"
            ? "Cannot reach backend server. Please verify backend is running."
            : "Could not launch demo customer.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/admin/login", {
        email: adminEmail,
        password: adminPassword,
      });
      setSuccess("Admin authenticated! Opening dashboard...");
      loginWithToken(res.data.token, "/admin");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          (err?.message === "Network Error"
            ? "Cannot reach backend server. Please verify backend is running."
            : "Admin authentication failed.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/admin/quick-login");
      setSuccess("Demo Admin Access Granted! Opening dashboard...");
      loginWithToken(res.data.token, "/admin");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          (err?.message === "Network Error"
            ? "Cannot reach backend server. Please verify backend is running."
            : "Could not launch demo admin.")
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="relative isolate flex min-h-[calc(100vh-73px)] items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-32 top-0 -z-10 h-96 w-96 rounded-full bg-[#f4a51c]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-96 w-96 rounded-full bg-[#d9472b]/15 blur-3xl" />
      
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#efd9bd] bg-[#fffdf8]/90 shadow-2xl backdrop-blur md:grid-cols-[.9fr_1.1fr]">
        {/* Left Side Banner */}
        <aside className="relative hidden min-h-[36rem] overflow-hidden bg-[#251611] p-10 text-white md:block">
          <div className="absolute -right-16 top-8 h-56 w-56 rounded-full border-[28px] border-[#f4a51c]/20" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-[#d9472b]/25 blur-2xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d9472b] text-xl font-black shadow-lg">
              P
            </div>

            
            <div className="mt-auto">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#f8cd72]">
                <Sparkles className="h-4 w-4" /> {activeTab === "admin" ? "Restaurant Portal" : "Authentic Flavours"}
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight">
                {activeTab === "admin" ? "Manage Kitchen, Menu & Live Orders" : "Good food is only a few taps away."}
              </h2>
              
              <ul className="mt-8 space-y-4 text-sm text-white/75">
                {activeTab === "admin" ? (
                  <>
                    <li className="flex items-center gap-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[#f8cd72]"><Check className="h-3.5 w-3.5" /></span>
                      Instant audio & in-app order notifications
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[#f8cd72]"><Check className="h-3.5 w-3.5" /></span>
                      Manage dishes, pricing & availability
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[#f8cd72]"><Check className="h-3.5 w-3.5" /></span>
                      Monitor revenue and track daily sales
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[#f8cd72]"><Check className="h-3.5 w-3.5" /></span>
                      Order online with COD, UPI QR & Cards
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[#f8cd72]"><Check className="h-3.5 w-3.5" /></span>
                      Track each order in real time
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[#f8cd72]"><Check className="h-3.5 w-3.5" /></span>
                      Save your favourite comfort dishes
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </aside>

        {/* Right Side Form */}
        <main className="flex flex-col justify-center p-7 sm:p-10 md:p-12">
          <div className="w-full">
            {/* Tab Selection */}
            <div className="flex rounded-2xl bg-[#fff1d5] p-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => { setActiveTab("customer"); setError(null); setSuccess(null); }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 ${
                  activeTab === "customer"
                    ? "bg-[#d9472b] text-white shadow-md"
                    : "text-[#765f55] hover:text-[#251611]"
                }`}
              >
                <User className="h-4 w-4" /> Customer Login
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("admin"); setError(null); setSuccess(null); }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 ${
                  activeTab === "admin"
                    ? "bg-[#251611] text-white shadow-md"
                    : "text-[#765f55] hover:text-[#251611]"
                }`}
              >
                <UtensilsCrossed className="h-4 w-4" /> Admin Portal
              </button>
            </div>

            {/* Error / Success Alerts */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3.5 text-sm font-semibold text-green-700">
                {success}
              </div>
            )}

            {/* ================= CUSTOMER PORTAL ================= */}
            {activeTab === "customer" && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-black text-[#251611]">
                    {customerMode === "login" ? "Customer Sign In" : "Create Customer Account"}
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode(customerMode === "login" ? "register" : "login");
                      setError(null);
                    }}
                    className="text-xs font-bold text-[#d9472b] hover:underline"
                  >
                    {customerMode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
                  </button>
                </div>
                <p className="mt-1 text-sm text-[#765f55]">
                  {customerMode === "login"
                    ? "Sign in to place orders, save favourites, and track delivery."
                    : "Sign up in seconds to start ordering from Park Paradise."}
                </p>


                {/* Email / Password Form */}
                <form onSubmit={handleCustomerAuth} className="mt-5 space-y-3.5">
                  {customerMode === "register" && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#765f55]">Your Name</label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#765f55]" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Harshit"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="zaika-input"
                          style={{ paddingLeft: "2.85rem" }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#765f55]">Email Address</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#765f55]" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="zaika-input"
                        style={{ paddingLeft: "2.85rem" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#765f55]">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#765f55]" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={customerPassword}
                        onChange={(e) => setCustomerPassword(e.target.value)}
                        className="zaika-input"
                        style={{ paddingLeft: "2.85rem" }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="zaika-button mt-2 w-full py-3.5 font-bold shadow-md"
                  >
                    {loading
                      ? "Please wait..."
                      : customerMode === "login"
                      ? "Sign In"
                      : "Create Account"}
                  </button>
                </form>

                {/* Instant Demo Customer Button */}
                <div className="mt-3.5">
                  <button
                    type="button"
                    onClick={handleQuickDemoCustomer}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#d9472b] bg-[#fff8ed] py-2.5 text-xs font-bold text-[#d9472b] transition hover:bg-[#fff1d5]"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    Instant Demo Customer Access (1-Click)
                  </button>
                </div>

                {/* Google OAuth Option */}
                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#efd9bd]" />
                  </div>
                  <span className="relative bg-[#fffdf8] px-3 text-xs font-bold uppercase tracking-wider text-[#765f55]">
                    Or
                  </span>
                </div>

                <a
                  href={customerGoogleUrl}
                  className="group flex w-full items-center justify-between rounded-xl border border-[#e6ceb0] bg-white px-4 py-3 font-bold text-[#251611] shadow-sm transition hover:border-[#d9472b] hover:shadow"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff1d5] text-sm font-black text-[#d9472b]">
                      G
                    </span>
                    <span>Continue with Google</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#d9472b] transition group-hover:translate-x-1" />
                </a>
              </div>
            )}


            {/* ================= ADMIN PORTAL ================= */}
            {activeTab === "admin" && (
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#251611] px-2.5 py-0.5 text-xs font-black text-[#f8cd72]">
                    OWNER / MANAGER
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-black text-[#251611]">Restaurant Administrator</h1>
                <p className="mt-1 text-sm text-[#765f55]">
                  Sign in with admin credentials to manage the restaurant, view live orders, and update menus.
                </p>

                <form onSubmit={handleAdminAuth} className="mt-5 space-y-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#765f55]">Admin Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#765f55]" />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="zaika-input"
                        style={{ paddingLeft: "2.85rem" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#765f55]">Admin Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#765f55]" />
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="zaika-input"
                        style={{ paddingLeft: "2.85rem" }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#251611] py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#3a221b] disabled:opacity-50"
                  >

                    <ShieldCheck className="h-4 w-4 text-[#f8cd72]" />
                    {loading ? "Verifying..." : "Sign In to Admin Dashboard"}
                  </button>
                </form>

                {/* Instant Demo Admin Button */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleQuickDemoAdmin}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#f4a51c] bg-[#fff8ed] py-2.5 text-xs font-black text-[#d9472b] transition hover:bg-[#fff1d5]"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    Instant Demo Admin Access (1-Click)
                  </button>
                </div>

                {/* Google Admin Login */}
                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#efd9bd]" />
                  </div>
                  <span className="relative bg-[#fffdf8] px-3 text-[11px] font-bold uppercase tracking-wider text-[#765f55]">
                    Or
                  </span>
                </div>

                <a
                  href={adminGoogleUrl}
                  className="group flex w-full items-center justify-between rounded-xl border border-[#e6ceb0] bg-white px-4 py-2.5 text-sm font-bold text-[#251611] shadow-sm transition hover:border-[#251611] hover:shadow"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#fff1d5] text-xs font-black text-[#d9472b]">
                      G
                    </span>
                    <span>Admin Sign In with Google</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#251611] transition group-hover:translate-x-1" />
                </a>
              </div>
            )}

            {/* Bottom feature highlights */}
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[#efd9bd] pt-6 text-center">
              <div>
                <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-[#fff1d5] text-[#d9472b]">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <p className="mt-1.5 text-xs font-bold text-[#251611]">Easy ordering</p>
              </div>
              <div>
                <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-red-50 text-[#d9472b]">
                  <Heart className="h-4 w-4" />
                </span>
                <p className="mt-1.5 text-xs font-bold text-[#251611]">Saved favourites</p>
              </div>
              <div>
                <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-green-50 text-[#15803d]">
                  <MapPin className="h-4 w-4" />
                </span>
                <p className="mt-1.5 text-xs font-bold text-[#251611]">Live tracking</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

