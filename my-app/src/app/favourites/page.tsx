"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Search, ShoppingBag, Sparkles, Trash2, UtensilsCrossed } from "lucide-react";
import { api } from "../lib/api";
import useAuthContext from "../hooks/useAuth";
import RestaurantLoader from "../components/RestaurantLoader";

interface FavouriteDish { _id: string; name: string; description?: string; imageUrl?: string; price: number; category?: string; isVeg: boolean; restaurantId?: { _id: string; name: string; logoUrl?: string }; }
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function FavouritesPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [items, setItems] = useState<FavouriteDish[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role === "admin") {
      setLoading(false);
      return;
    }

    api
      .get("/favourites")
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Could not load favourite items."))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const visibleItems = useMemo(
    () =>
      items.filter((item) =>
        `${item.name} ${item.category || ""} ${item.description || ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [items, query]
  );

  const removeFavourite = async (dishId: string) => {
    const previous = items;
    setRemoving(dishId);
    setItems((current) => current.filter((item) => item._id !== dishId));
    try {
      const res = await api.delete(`/favourites/${dishId}`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems(previous);
      setError("Could not remove this favourite.");
    } finally {
      setRemoving(null);
    }
  };

  if (authLoading || loading) return <RestaurantLoader label="Gathering your favourites" />;

  if (user?.role === "admin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="zaika-card rounded-3xl p-10">
          <Heart className="mx-auto h-11 w-11 text-[#d9472b]" />
          <h1 className="mt-4 text-3xl font-black text-[#251611]">Admin Account</h1>
          <p className="mx-auto mt-3 max-w-md text-[#765f55]">
            Favourites are for customer accounts. As an admin, you can manage the full menu catalogue in the Kitchen Dashboard.
          </p>
          <Link href="/admin" className="zaika-button mt-6 inline-flex items-center gap-2 px-6 py-3">
            Open Kitchen Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="zaika-card rounded-3xl p-10">
          <Heart className="mx-auto h-11 w-11 text-[#d9472b]" />
          <h1 className="mt-4 text-3xl font-black text-[#251611]">Save what you love</h1>
          <p className="mx-auto mt-3 max-w-md text-[#765f55]">
            Sign in to build a shortcut to all your favourite dishes.
          </p>
          <Link href="/login" className="zaika-button mt-6 inline-block px-6 py-3">
            Login to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">

      <section className="relative overflow-hidden rounded-3xl bg-[#251611] p-7 text-white shadow-xl md:p-10">
        <div className="absolute -right-14 -top-12 grid h-56 w-56 place-items-center rounded-full border-[28px] border-[#d9472b]/35">
          <Heart className="h-10 w-10 fill-[#f4a51c]/30 text-[#f4a51c]/50" />
        </div>
        <div className="relative">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.18em] text-[#f8cd72]">
            <Sparkles className="h-4 w-4" /> Your personal menu
          </p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-5xl">Favourite dishes</h1>
              <p className="mt-2 max-w-xl text-white/70">
                All your go-to comfort plates, saved for when the craving calls.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-center">
              <p className="text-2xl font-black">{items.length}</p>
              <p className="text-xs font-bold text-white/65">Saved dishes</p>
            </div>
          </div>
        </div>
      </section>
      {error && <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}

    {items.length === 0 ? (
      <div className="zaika-card mt-6 rounded-3xl p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-[#d9472b]">
          <Heart className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-2xl font-black text-[#251611]">Start your favourites list</h2>
        <p className="mx-auto mt-2 max-w-md text-[#765f55]">
          Tap the heart on any dish you love and it will be ready here whenever you are.
        </p>
        <Link href="/menu" className="zaika-button mt-6 inline-flex items-center gap-2 px-6 py-3">
          Explore menu <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    ) : (
      <>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-[#765f55]">
            {visibleItems.length} {visibleItems.length === 1 ? "dish" : "dishes"} ready to order again
          </p>
          <label className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d9472b]" />
            <input
              className="zaika-input pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search saved dishes"
            />
          </label>
        </div>
        {visibleItems.length ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => (
              <article
                key={item._id}
                className="group flex overflow-hidden rounded-3xl border border-[#efd9bd] bg-[#fffdf8] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:block"
              >
                <div className="relative h-36 w-36 shrink-0 overflow-hidden bg-[#fff1d5] sm:h-52 sm:w-full">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-[#d9472b]">
                      <UtensilsCrossed className="h-7 w-7" />
                    </span>
                  )}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.isVeg ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {item.isVeg ? "Veg" : "Non-veg"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold uppercase tracking-[.12em] text-[#d9472b]">
                        {item.category || "Saved dish"}
                      </p>
                      <h2 className="mt-1 truncate text-xl font-black text-[#251611]">{item.name}</h2>
                    </div>
                    <button
                      disabled={removing === item._id}
                      onClick={() => removeFavourite(item._id)}
                      className="rounded-xl p-2 text-[#d9472b] transition hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Remove ${item.name}`}
                      title="Remove favourite"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#765f55]">
                    {item.description || "A customer favourite, saved for your next order."}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <span className="font-black text-[#d9472b]">{money(item.price)}</span>
                    <Link
                      href="/menu"
                      className="flex items-center gap-1 text-sm font-bold text-[#251611] hover:text-[#d9472b]"
                    >
                      Order again <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="zaika-card mt-5 rounded-3xl p-10 text-center">
            <Search className="mx-auto h-8 w-8 text-[#d9472b]" />
            <h2 className="mt-3 text-xl font-black text-[#251611]">No saved dish found</h2>
            <p className="mt-1 text-sm text-[#765f55]">Try a different name or clear your search.</p>
            <button onClick={() => setQuery("")} className="mt-4 font-bold text-[#d9472b]">
              Clear search
            </button>
          </div>
        )}
      </>
    )}
  </div>
);
}

