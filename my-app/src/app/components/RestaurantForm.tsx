"use client";

import { useState } from "react";
import { api } from "../lib/api";
import CloudinaryImageUpload from "./CloudinaryImageUpload";

interface Props {
  onSuccess: (data: any) => void;
  initialRestaurant?: any;
  mode?: "create" | "edit";
  onCancel?: () => void;
}

const emptyForm = {
  name: "",
  description: "",
  address: {
    street: "",
    city: "",
    state: "",
    zip: "",
    latitude: "",
    longitude: "",
  },
  cuisine: "",
  logoUrl: "",
  openingHours: "",
  isVeg: false,
};

const getInitialForm = (restaurant?: any) => {
  if (!restaurant) return emptyForm;

  return {
    name: restaurant.name || "",
    description: restaurant.description || "",
    address: {
      street: restaurant.address?.street || "",
      city: restaurant.address?.city || "",
      state: restaurant.address?.state || "",
      zip: restaurant.address?.zip || "",
      latitude:
        restaurant.address?.latitude === undefined
          ? ""
          : String(restaurant.address.latitude),
      longitude:
        restaurant.address?.longitude === undefined
          ? ""
          : String(restaurant.address.longitude),
    },
    cuisine: Array.isArray(restaurant.cuisine)
      ? restaurant.cuisine.join(", ")
      : restaurant.cuisine || "",
    logoUrl: restaurant.logoUrl || "",
    openingHours: restaurant.openingHours || "",
    isVeg: Boolean(restaurant.isVeg),
  };
};

export default function RestaurantForm({
  onSuccess,
  initialRestaurant,
  mode = "create",
  onCancel,
}: Props) {
  const [form, setForm] = useState({
    ...getInitialForm(initialRestaurant),
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      address: {
        ...form.address,
        [name]: value,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...form,
        address: {
          ...form.address,
          latitude: form.address.latitude ? Number(form.address.latitude) : undefined,
          longitude: form.address.longitude ? Number(form.address.longitude) : undefined,
        },
        cuisine: form.cuisine
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean),
      };
      const res =
        mode === "edit"
          ? await api.put("/restaurants/vendor/update", payload)
          : await api.post("/restaurants", payload);
      setMessage(
        mode === "edit"
          ? "Restaurant updated successfully!"
          : "Restaurant created successfully!"
      );
      onSuccess(res.data);
      if (mode === "create") {
        setForm(emptyForm);
      }
    } catch (err: any) {
      setMessage(
        err.response?.data?.error ||
          (mode === "edit" ? "Error updating restaurant" : "Error creating restaurant")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="zaika-card max-w-2xl rounded-2xl p-6">
      <h2 className="text-2xl font-black text-[#251611]">
        {mode === "edit" ? "Edit Restaurant Profile" : "Create Your Restaurant"}
      </h2>
      <p className="mb-5 mt-1 text-sm text-[#765f55]">
        {mode === "edit"
          ? "Update the details customers will see on Zaika Online."
          : "Add the core details customers will see on Zaika Online."}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Restaurant Name"
          value={form.name}
          onChange={handleChange}
          className="zaika-input"
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="zaika-input"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {["street", "city", "state", "zip", "latitude", "longitude"].map((field) => (
            <input
              key={field}
              type="text"
              name={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form.address[field as keyof typeof form.address]}
              onChange={handleAddressChange}
              className="zaika-input"
            />
          ))}
        </div>
        <input
          type="text"
          name="cuisine"
          placeholder="Cuisine Types, comma separated"
          value={form.cuisine}
          onChange={handleChange}
          className="zaika-input"
        />
        <input
          type="text"
          name="openingHours"
          placeholder="Opening Hours"
          value={form.openingHours}
          onChange={handleChange}
          className="zaika-input"
        />
        <input
          type="text"
          name="logoUrl"
          placeholder="Logo/Image URL"
          value={form.logoUrl}
          onChange={handleChange}
          className="zaika-input"
        />
        <CloudinaryImageUpload
          label="Restaurant image"
          purpose="restaurant-logo"
          value={form.logoUrl}
          onUploaded={(imageUrl) =>
            setForm((current) => ({ ...current, logoUrl: imageUrl }))
          }
        />
        <label className="flex items-center gap-2 text-sm font-semibold text-[#765f55]">
          <input
            type="checkbox"
            name="isVeg"
            checked={form.isVeg}
            onChange={handleChange}
          />
          Pure veg restaurant
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className="zaika-button flex-1 py-3"
          >
            {loading
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
                ? "Update Restaurant"
                : "Create Restaurant"}
          </button>
          {mode === "edit" && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-[#efd9bd] px-6 py-3 font-bold text-[#765f55] hover:bg-[#fff8ed]"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      {message && <p className="mt-3 text-center text-sm font-semibold text-[#765f55]">{message}</p>}
    </div>
  );
}
