import Link from "next/link";
import { ArrowRight, Clock3, Heart, MapPin, Sparkles, Star, Utensils } from "lucide-react";

export const dynamic = "force-dynamic";

interface Restaurant { _id: string; name: string; description: string; logoUrl?: string; cuisine?: string[]; openingHours?: string; rating?: number; address?: { street?: string; city?: string; state?: string } }
interface Dish { _id: string; name: string; description?: string; imageUrl?: string; price: number; category?: string; isVeg: boolean }

async function fetchStorefront(): Promise<{ restaurant: Restaurant | null; dishes: Dish[] }> {
  const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:5004";
  try {
    let restaurant: Restaurant | null = null;
    const restaurantRes = await fetch(`${base}/restaurants/current`, { cache: "no-store" });
    if (restaurantRes.ok) {
      restaurant = await restaurantRes.json();
    } else {
      const allRes = await fetch(`${base}/restaurants`, { cache: "no-store" });
      if (allRes.ok) {
        const list = await allRes.json();
        if (Array.isArray(list) && list.length) restaurant = list[0];
      }
    }

    const restId = restaurant?._id || "current";
    const dishesRes = await fetch(`${base}/dishes/restaurants/${restId}/dishes`, { cache: "no-store" });
    const dishes = dishesRes.ok ? await dishesRes.json() : [];
    
    return {
      restaurant: restaurant || {
        _id: "default",
        name: "Park Paradise",
        description: "Freshly prepared authentic food with rich spices and traditional recipes.",
        cuisine: ["North Indian", "Mughlai", "Biryani"],
        openingHours: "10:00 AM - 11:00 PM",
        rating: 4.8,
      },
      dishes: Array.isArray(dishes) ? dishes : [],
    };
  } catch {
    return {
      restaurant: {
        _id: "default",
        name: "Park Paradise",
        description: "Freshly prepared authentic food with rich spices and traditional recipes.",
        cuisine: ["North Indian", "Mughlai", "Biryani"],
        openingHours: "10:00 AM - 11:00 PM",
        rating: 4.8,
      },
      dishes: [],
    };
  }
}

function money(value: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }

export default async function HomePage() {
  const { restaurant, dishes } = await fetchStorefront();
  const address = [restaurant?.address?.street, restaurant?.address?.city, restaurant?.address?.state].filter(Boolean).join(", ");
  const featured = dishes.slice(0, 4);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 md:pb-16 md:pt-12">
        <div className="pointer-events-none absolute -left-24 top-4 h-64 w-64 rounded-full bg-[#f4a51c]/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-[#d9472b]/10 blur-3xl" />
        <div className="relative grid overflow-hidden rounded-[2rem] border border-[#efd9bd] bg-[#251611] shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative z-10 flex flex-col justify-center p-8 text-white md:p-14">
            <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-[#f8cd72]">
              <Sparkles className="h-3.5 w-3.5" /> Freshly made, just for you
            </div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f4a51c]">Welcome to {restaurant?.name || "Park Paradise"}</p>

            <h1 className="mt-4 max-w-xl text-5xl font-black leading-[.98] md:text-6xl">A little comfort in every bite.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">{restaurant?.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/menu" className="zaika-button flex items-center gap-2 px-6 py-3">
                Order Online / View Menu <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/orders" className="rounded-xl border border-white/20 px-6 py-3 font-bold text-white transition hover:bg-white/10">
                Track order
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-white/85">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-[#f4a51c] text-[#f4a51c]" />
                {restaurant?.rating ? `${restaurant.rating.toFixed(1)} customer rating` : "Made with care"}
              </span>
              {restaurant?.openingHours && (
                <span className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#f4a51c]" />{restaurant.openingHours}
                </span>
              )}
            </div>
          </div>
          <div className="relative min-h-[25rem] lg:min-h-full">
            <img src={restaurant?.logoUrl || "/placeholder.jpg"} alt={restaurant?.name || "Restaurant"} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent lg:bg-gradient-to-r" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-black/25 p-4 text-white backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#f8cd72]">Today’s kitchen specials</p>
              <p className="mt-1 text-lg font-black">{restaurant?.cuisine?.join(" · ") || "Made fresh daily"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Badges */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="grid gap-4 rounded-3xl border border-[#efd9bd] bg-[#fffdf8]/75 p-4 shadow-sm md:grid-cols-3 md:p-5">
          <div className="flex items-center gap-4 rounded-2xl p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff1d5] text-[#d9472b]">
              <Utensils className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black text-[#251611]">Made after you order</p>
              <p className="text-sm text-[#765f55]">Fresh, authentic recipes.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-50 text-[#15803d]">
              <Heart className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black text-[#251611]">Easy Payment Modes</p>
              <p className="text-sm text-[#765f55]">COD, UPI QR & Cards supported.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff1d5] text-[#d9472b]">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black text-[#251611]">Delivered with care</p>
              <p className="truncate text-sm text-[#765f55]">{address || "Hot & fresh to your doorstep."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dishes */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#d9472b]">Fresh picks</p>
            <h2 className="mt-1 text-3xl font-black text-[#251611] md:text-4xl">Popular on the menu</h2>
            <p className="mt-2 text-[#765f55]">A few favourites from our kitchen.</p>
          </div>
          <Link href="/menu" className="flex items-center gap-2 font-bold text-[#d9472b] hover:text-[#b73521]">
            See full menu <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {featured.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((dish, index) => (
              <Link key={dish._id} href="/menu" className="group relative overflow-hidden rounded-2xl border border-[#efd9bd] bg-[#fffdf8] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-48 overflow-hidden bg-[#fff1d5]">
                  <img src={dish.imageUrl || "/placeholder.jpg"} alt={dish.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute left-3 top-3 rounded-full bg-[#fffdf8]/95 px-2.5 py-1 text-xs font-black text-[#251611]">0{index + 1}</div>
                  <span className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold ${dish.isVeg ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {dish.isVeg ? "Veg" : "Non-veg"}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black text-[#251611]">{dish.name}</h3>
                    <span className="whitespace-nowrap text-sm font-black text-[#d9472b]">{money(dish.price)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#765f55]">{dish.description || dish.category || "Prepared fresh from our kitchen."}</p>
                  <p className="mt-4 text-sm font-bold text-[#d9472b]">Order now <span className="inline-block transition group-hover:translate-x-1">→</span></p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="zaika-card rounded-2xl p-8 text-center text-[#765f55]">
            <p>Our kitchen menu is ready for ordering.</p>
            <Link href="/menu" className="zaika-button mt-4 inline-block px-6 py-2.5">
              Browse Menu
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

