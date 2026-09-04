import { Clock, MapPin, Sparkles, Star, UtensilsCrossed } from "lucide-react";
import MenuOrderPanel from "../components/MenuOrderPanel";

export const dynamic = "force-dynamic";

interface Restaurant {
  _id: string;
  name: string;
  description: string;
  logoUrl?: string;
  cuisine?: string[];
  openingHours?: string;
  rating?: number;
  address?: { street?: string; city?: string; state?: string; zip?: string };
}

interface Dish {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  category?: string;
  isVeg: boolean;
}

async function fetchMenuData(): Promise<{ restaurant: Restaurant | null; dishes: Dish[] }> {
  const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:5004";
  try {
    let restaurant: Restaurant | null = null;
    const res = await fetch(`${base}/restaurants/current`, { cache: "no-store" });
    if (res.ok) {
      restaurant = await res.json();
    } else {
      const allRes = await fetch(`${base}/restaurants`, { cache: "no-store" });
      if (allRes.ok) {
        const all = await allRes.json();
        if (Array.isArray(all) && all.length > 0) restaurant = all[0];
      }
    }

    const restaurantId = restaurant?._id || "current";
    const dishesRes = await fetch(`${base}/dishes/restaurants/${restaurantId}/dishes`, {
      cache: "no-store",
    });
    const dishes = dishesRes.ok ? await dishesRes.json() : [];

    return {
      restaurant: restaurant || {
        _id: "default-park-paradise",
        name: "Park Paradise",
        description: "Freshly prepared authentic food with rich spices and traditional recipes.",
        cuisine: ["North Indian", "Mughlai", "Biryani", "Curries"],
        openingHours: "10:00 AM - 11:00 PM",
        rating: 4.8,
      },
      dishes: Array.isArray(dishes) ? dishes : [],
    };
  } catch (err) {
    console.error("Failed to load menu data:", err);
    return {
      restaurant: {
        _id: "default-park-paradise",
        name: "Park Paradise",
        description: "Freshly prepared authentic food with rich spices and traditional recipes.",
        cuisine: ["North Indian", "Mughlai", "Biryani", "Curries"],
        openingHours: "10:00 AM - 11:00 PM",
        rating: 4.8,
      },
      dishes: [],
    };
  }

}

export default async function MenuPage() {
  const { restaurant, dishes } = await fetchMenuData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Header Banner */}
      <section className="relative mb-10 overflow-hidden rounded-3xl bg-[#251611] p-7 text-white shadow-xl md:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-[30px] border-[#f4a51c]/15" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#f8cd72]">
              <Sparkles className="h-4 w-4" /> Fresh Kitchen Selection
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4a51c] px-3.5 py-1 text-xs font-black text-[#251611] shadow-sm">
              🚚 FREE Delivery on orders above ₹150
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-5xl">{restaurant?.name || "Our Menu"}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
                {restaurant?.description || "Select your favourite dishes and order directly to your door."}
              </p>
            </div>
            {restaurant?.cuisine && (
              <div className="flex flex-wrap gap-2">
                {restaurant.cuisine.slice(0, 3).map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#f8cd72]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Menu & Checkout Order Panel */}
      <MenuOrderPanel
        restaurantId={restaurant?._id || "current"}
        dishes={dishes}
      />
    </div>
  );
}

