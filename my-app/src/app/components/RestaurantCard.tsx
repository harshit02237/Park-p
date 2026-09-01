"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";


interface Restaurant {
  _id: string;
  name: string;
  logoUrl?: string;         
  cuisine?: string[];        
  address?: {                
    street?: string;
    city?: string;
    state?: string;
  };
  rating?: number;
}

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const formattedAddress = restaurant.address
    ? [restaurant.address.street, restaurant.address.city].filter(Boolean).join(", ")
    : "Address not available";

  return (
    <Link
      href={`/restaurants/${restaurant._id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#efd9bd] bg-[#fffdf8] shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative">
        <img
          src={restaurant.logoUrl || "/placeholder.jpg"}
          alt={restaurant.name}
          className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        {typeof restaurant.rating === "number" && restaurant.rating > 0 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#fffdf8] px-2.5 py-1 text-xs font-bold text-[#251611] shadow">
            <Star className="h-3.5 w-3.5 fill-[#f4a51c] text-[#f4a51c]" />
            {restaurant.rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="flex flex-grow flex-col p-4">
        <h3 className="mb-1 truncate text-lg font-black text-[#251611]">
          {restaurant.name}
        </h3>
        <p className="mb-4 text-sm font-medium text-[#765f55]">
          {restaurant.cuisine?.length ? restaurant.cuisine.join(", ") : "Freshly prepared favorites"}
        </p>
        <p className="mt-auto flex items-center gap-1.5 text-xs font-medium text-[#765f55]">
          <MapPin className="h-3.5 w-3.5 text-[#d9472b]" />
          <span className="truncate">{formattedAddress}</span>
        </p>
      </div>
    </Link>
  );
}
