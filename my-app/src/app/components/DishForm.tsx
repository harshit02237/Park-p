"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Pencil, Trash2 } from "lucide-react";
import CloudinaryImageUpload from "./CloudinaryImageUpload";

interface Dish {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  imageUrl?: string;
}

interface Props {
  restaurantId: string;
}

export default function DishForm({ restaurantId }: Props) {
  const [form, setForm] = useState<Dish>({
    name: "",
    description: "",
    price: 0,
    category: "",
    isVeg: true,
    imageUrl: "",
  });

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  const fetchDishes = async () => {
    if (!restaurantId) return;
    try {
      const res = await api.get(`/dishes/restaurants/${restaurantId}/dishes`);
      setDishes(res.data || []);
    } catch (err) {
      console.error("Error fetching dishes:", err);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, [restaurantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return alert("Restaurant ID missing");
    setLoading(true);

    try {
      if (editingDish) {
        await api.put(`/dishes/${editingDish._id}`, { ...form, restaurantId });
      } else {
        await api.post(`/dishes`, { ...form, restaurantId });
      }

      await fetchDishes();

      setForm({
        name: "",
        description: "",
        price: 0,
        category: "",
        isVeg: true,
        imageUrl: "",
      });
      setEditingDish(null);
    } catch (err) {
      console.error("Error saving dish:", err);
      alert("Failed to save dish");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setForm({
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category,
      isVeg: dish.isVeg,
      imageUrl: dish.imageUrl || "",
      _id: dish._id,
    });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this dish?")) return;
    try {
      await api.delete(`/dishes/${id}`);
      await fetchDishes();
    } catch (err) {
      console.error("Error deleting dish:", err);
    }
  };

  return (
    <div className="zaika-card mt-6 rounded-2xl p-6">
      <h2 className="mb-4 text-2xl font-black text-[#251611]">
        {editingDish ? "Edit Dish" : "Add New Dish"}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="name"
          placeholder="Dish Name"
          value={form.name}
          onChange={handleChange}
          className="zaika-input"
          required
        />

        <input
          type="number"
          name="price"
          placeholder="Price (₹)"
          value={form.price}
          onChange={handleChange}
          className="zaika-input"
          required
        />

        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#765f55]">
            Food Category
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Fast Food", icon: "🍔" },
              { label: "Meals", icon: "🍛" },
              { label: "Desserts", icon: "🍰" },
              { label: "Beverages", icon: "🥤" },
            ].map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, category: cat.label }))}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  form.category?.toLowerCase() === cat.label.toLowerCase()
                    ? "bg-[#d9472b] text-white shadow-md"
                    : "border border-[#efd9bd] bg-[#fffdf8] text-[#765f55] hover:bg-[#fff1d5]"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            name="category"
            placeholder="Or type custom category..."
            value={form.category}
            onChange={handleChange}
            className="zaika-input mt-1.5"
          />
        </div>

        <label className="flex items-center space-x-2 text-sm font-semibold text-[#765f55] md:col-span-2">
          <input
            type="checkbox"
            name="isVeg"
            checked={form.isVeg}
            onChange={handleChange}
            className="h-4 w-4 rounded accent-green-600"
          />
          <span className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${form.isVeg ? "bg-green-600" : "bg-red-600"}`} />
            <span>{form.isVeg ? "Vegetarian Dish (Veg)" : "Non-Vegetarian Dish (Non-Veg)"}</span>
          </span>
        </label>

        <input
          type="text"
          name="imageUrl"
          placeholder="Image URL (optional)"
          value={form.imageUrl}
          onChange={handleChange}
          className="zaika-input md:col-span-2"
        />

        <div className="md:col-span-2">
          <CloudinaryImageUpload
            label="Dish image"
            purpose="dish-image"
            value={form.imageUrl}
            onUploaded={(imageUrl) =>
              setForm((current) => ({ ...current, imageUrl }))
            }
          />
        </div>

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="zaika-input md:col-span-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="zaika-button md:col-span-2 py-3"
        >
          {loading ? "Saving..." : editingDish ? "Update Dish" : "Add Dish"}
        </button>
      </form>

      <h3 className="mt-7 mb-3 text-lg font-black text-[#251611]">Your Dishes</h3>

      {dishes.length === 0 ? (
        <p className="text-sm text-[#765f55]">No dishes yet.</p>
      ) : (
        <ul className="space-y-3">
          {dishes.map((d) => (
            <li
              key={d._id}
              className="flex items-center justify-between rounded-xl border border-[#efd9bd] bg-[#fffdf8] p-3"
            >
              <div className="flex gap-3 items-center">
                {d.imageUrl && (
                  <img
                    src={d.imageUrl}
                    alt={d.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h4 className="font-bold text-[#251611]">{d.name}</h4>
                  <p className="text-sm font-bold text-[#d9472b]">₹{d.price}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {d.category && (
                      <span className="rounded-md bg-[#fff1d5] px-2 py-0.5 text-xs font-bold text-[#765f55]">
                        {d.category}
                      </span>
                    )}
                    {d.isVeg ? (
                      <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                        Veg
                      </span>
                    ) : (
                      <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
                        Non-Veg
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(d)}
                  className="rounded-full p-2 text-[#765f55] hover:bg-[#fff1d5] hover:text-[#d9472b]"
                  title="Edit"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(d._id)}
                  className="rounded-full p-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
