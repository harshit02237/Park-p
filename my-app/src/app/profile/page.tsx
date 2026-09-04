"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Edit2,
  Heart,
  Mail,
  ReceiptText,
  Save,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  UtensilsCrossed,
} from "lucide-react";

import { api } from "../lib/api";
import useAuthContext from "../hooks/useAuth";
import RestaurantLoader from "../components/RestaurantLoader";

export default function ProfilePage() {
  const { user, loading: authLoading, logout, loginWithToken } = useAuthContext();
  const router = useRouter();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Stats
  const [orderCount, setOrderCount] = useState<number>(0);
  const [favouriteCount, setFavouriteCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatar(user.avatar || "");

      // Fetch customer's orders and favourites count only if not admin
      if (user.role !== "admin") {
        Promise.allSettled([api.get("/orders/my"), api.get("/favourites")]).then(([ordersRes, favsRes]) => {
          if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value.data)) {
            setOrderCount(ordersRes.value.data.length);
          }
          if (favsRes.status === "fulfilled" && Array.isArray(favsRes.value.data)) {
            setFavouriteCount(favsRes.value.data.length);
          }
        });
      }
    }
  }, [user]);


  if (authLoading) {
    return <RestaurantLoader label="Loading your profile" />;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="zaika-card rounded-3xl p-10">
          <User className="mx-auto h-12 w-12 text-[#d9472b]" />
          <h1 className="mt-4 text-2xl font-black text-[#251611]">Account Login Required</h1>
          <p className="mt-2 text-sm text-[#765f55]">Please sign in to view and manage your account details.</p>
          <Link href="/login" className="zaika-button mt-6 inline-block px-6 py-2.5">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await api.put("/auth/profile", {
        name: name.trim(),
        avatar: avatar.trim(),
      });

      if (res.data?.token) {
        loginWithToken(res.data.token);
      }

      setStatusMessage({ type: "success", text: "Profile updated successfully!" });
      setEditing(false);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user.role === "admin";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[#251611] p-8 text-white shadow-xl md:p-10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#d9472b]/30 blur-2xl" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            {/* Avatar badge */}
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-[#d9472b] bg-[#fff1d5] flex items-center justify-center text-2xl font-black text-[#d9472b] shadow-md shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span>{(user.name || "U")[0].toUpperCase()}</span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-black md:text-3xl">{user.name}</h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                    isAdmin
                      ? "bg-[#f4a51c] text-[#251611]"
                      : "bg-[#d9472b] text-white"
                  }`}
                >
                  {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  {isAdmin ? "Restaurant Admin" : "Customer"}
                </span>
              </div>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-white/75 sm:justify-start">
                <Mail className="h-4 w-4" /> {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
          >
            <Edit2 className="h-3.5 w-3.5" />
            {editing ? "Cancel Editing" : "Edit Profile"}
          </button>
        </div>
      </section>

      {/* Alert status messages */}
      {statusMessage && (
        <div
          className={`mt-4 rounded-2xl p-4 text-sm font-semibold ${
            statusMessage.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Edit Form */}
      {editing && (
        <form onSubmit={handleSaveProfile} className="zaika-card mt-6 rounded-3xl p-6 md:p-8">
          <h2 className="text-lg font-black text-[#251611]">Update Account Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#765f55] mb-1">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="zaika-input"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#765f55] mb-1">Avatar Image URL (Optional)</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="zaika-input"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#765f55] hover:bg-[#fff1d5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="zaika-button flex items-center gap-2 px-6 py-2.5 text-xs font-bold"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* Quick Activity & Portal Cards */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isAdmin ? (
          <>
            <div className="zaika-card flex flex-col justify-between rounded-3xl p-6">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1d5] text-[#d9472b]">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-black text-[#251611]">Live Orders Desk</h3>
                <p className="mt-1 text-xs text-[#765f55]">
                  Manage incoming customer orders in real time, advance food statuses, and trigger live chimes.
                </p>
              </div>
              <Link
                href="/admin"
                className="zaika-button mt-6 flex items-center justify-between px-4 py-2.5 text-xs font-bold"
              >
                <span>Open Live Orders</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="zaika-card flex flex-col justify-between rounded-3xl p-6">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1d5] text-[#d9472b]">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-black text-[#251611]">Menu Catalogue</h3>
                <p className="mt-1 text-xs text-[#765f55]">
                  Add new dishes, update pricing, upload food photography, and toggle availability.
                </p>
              </div>
              <Link
                href="/admin"
                className="rounded-xl border border-[#efd9bd] bg-[#fff8ed] mt-6 flex items-center justify-between px-4 py-2.5 text-xs font-bold text-[#251611] hover:bg-[#fff1d5]"
              >
                <span>Manage Menu Dishes</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="zaika-card flex flex-col justify-between rounded-3xl p-6">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1d5] text-[#d9472b]">
                  <Store className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-black text-[#251611]">Storefront Settings</h3>
                <p className="mt-1 text-xs text-[#765f55]">
                  Configure restaurant address, opening hours, brand logo, and kitchen details.
                </p>
              </div>
              <Link
                href="/admin"
                className="rounded-xl border border-[#efd9bd] bg-[#fff8ed] mt-6 flex items-center justify-between px-4 py-2.5 text-xs font-bold text-[#251611] hover:bg-[#fff1d5]"
              >
                <span>Restaurant Settings</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : (

          <>
            <div className="zaika-card flex flex-col justify-between rounded-3xl p-6">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1d5] text-[#d9472b]">
                  <ReceiptText className="h-6 w-6" />
                </div>
                <p className="mt-4 text-3xl font-black text-[#251611]">{orderCount}</p>
                <h3 className="text-sm font-black text-[#251611]">Orders Placed</h3>
                <p className="mt-1 text-xs text-[#765f55]">Track your live deliveries and past order history.</p>
              </div>
              <Link
                href="/orders"
                className="zaika-button mt-6 flex items-center justify-between px-4 py-2.5 text-xs font-bold"
              >
                <span>View Order Status</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="zaika-card flex flex-col justify-between rounded-3xl p-6">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-[#d9472b]">
                  <Heart className="h-6 w-6" />
                </div>
                <p className="mt-4 text-3xl font-black text-[#251611]">{favouriteCount}</p>
                <h3 className="text-sm font-black text-[#251611]">Saved Favourites</h3>
                <p className="mt-1 text-xs text-[#765f55]">Quick access to your most-loved dishes.</p>
              </div>
              <Link
                href="/favourites"
                className="rounded-xl border border-[#efd9bd] bg-[#fff8ed] mt-6 flex items-center justify-between px-4 py-2.5 text-xs font-bold text-[#251611] hover:bg-[#fff1d5]"
              >
                <span>My Favourites</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="zaika-card flex flex-col justify-between rounded-3xl p-6">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1d5] text-[#d9472b]">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <p className="mt-4 text-3xl font-black text-[#251611]">Park Paradise</p>
                <h3 className="text-sm font-black text-[#251611]">Today's Kitchen Menu</h3>
                <p className="mt-1 text-xs text-[#765f55]">Order delicious warm dishes with COD, UPI QR, or Cards.</p>
              </div>
              <Link
                href="/menu"
                className="rounded-xl border border-[#efd9bd] bg-[#fff8ed] mt-6 flex items-center justify-between px-4 py-2.5 text-xs font-bold text-[#251611] hover:bg-[#fff1d5]"
              >
                <span>Order Food Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Logout Action Bar */}
      <div className="mt-10 flex justify-end">
        <button
          onClick={logout}
          className="rounded-2xl border border-red-200 bg-red-50 px-6 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100 hover:text-red-700"
        >
          Sign Out of Account
        </button>
      </div>
    </div>
  );
}

