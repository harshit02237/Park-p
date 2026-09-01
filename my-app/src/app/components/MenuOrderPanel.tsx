"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CreditCard, Filter, Heart, MapPin, Minus, Phone, Plus, QrCode, Receipt, ShieldCheck, ShoppingBag, Smartphone, Trash2, User, Utensils } from "lucide-react";
import { api } from "../lib/api";
import useAuthContext from "../hooks/useAuth";

interface Dish {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  category?: string;
  isVeg: boolean;
}

interface CartItem {
  dish: Dish;
  quantity: number;
}

type PaymentMethod = "cod" | "upi" | "card";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MenuOrderPanel({
  restaurantId,
  dishes,
}: {
  restaurantId: string;
  dishes: Dish[];
}) {
  const { user } = useAuthContext();
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [upiId, setUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [cardPaid, setCardPaid] = useState(false);


  // Filters
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [vegFilter, setVegFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [placingOrder, setPlacingOrder] = useState(false);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    dishes.forEach((d) => {
      if (d.category) cats.add(d.category);
    });
    return ["all", ...Array.from(cats)];
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchCat = selectedCategory === "all" || dish.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchVeg = !vegFilter || dish.isVeg;
      const matchSearch = !searchQuery || `${dish.name} ${dish.description || ""} ${dish.category || ""}`.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchVeg && matchSearch;
    });
  }, [dishes, selectedCategory, vegFilter, searchQuery]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.dish.price * item.quantity,
    0
  );
  const deliveryFee = itemCount > 0 ? 29 : 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (user?.name && !customerName) {
      setCustomerName(user.name);
    }
  }, [user]);


  useEffect(() => {
    if (!user) return;

    api
      .get("/favourites")
      .then((res) => {
        const ids = Array.isArray(res.data)
          ? res.data.map((dish: Dish) => dish._id)
          : [];
        setFavouriteIds(new Set(ids));
      })
      .catch(() => {
        setFavouriteIds(new Set());
      });
  }, [user]);

  const updateQuantity = (dish: Dish, delta: number) => {
    setError(null);
    setCart((current) => {
      const existing = current[dish._id]?.quantity || 0;
      const nextQuantity = existing + delta;
      const nextCart = { ...current };

      if (nextQuantity <= 0) {
        delete nextCart[dish._id];
      } else {
        nextCart[dish._id] = { dish, quantity: nextQuantity };
      }

      return nextCart;
    });
  };

  const toggleFavourite = async (dish: Dish) => {
    setError(null);

    if (!user) {
      setError("Please login to save favourite items.");
      return;
    }

    const isFavourite = favouriteIds.has(dish._id);
    const nextIds = new Set(favouriteIds);

    if (isFavourite) {
      nextIds.delete(dish._id);
    } else {
      nextIds.add(dish._id);
    }

    setFavouriteIds(nextIds);

    try {
      const res = isFavourite
        ? await api.delete(`/favourites/${dish._id}`)
        : await api.post(`/favourites/${dish._id}`);
      const ids = Array.isArray(res.data)
        ? res.data.map((item: Dish) => item._id)
        : Array.from(nextIds);
      setFavouriteIds(new Set(ids));
    } catch (err: any) {
      setFavouriteIds(favouriteIds);
      setError(err?.response?.data?.message || "Could not update favourites.");
    }
  };

  const placeOrder = async () => {
    setError(null);

    if (!user) {
      setError("Please sign in or register to place your order.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Add at least one dish to your cart.");
      return;
    }

    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!customerPhone.trim()) {
      setError("Please enter your mobile phone number.");
      return;
    }

    if (!deliveryLocation.trim()) {
      setError("Please enter your delivery location / address.");
      return;
    }

    if (paymentMethod === "card" && !cardPaid) {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
        setError("Please enter your card details to complete payment.");
        return;
      }
    }

    try {
      setPlacingOrder(true);
      const isPrepaid = paymentMethod !== "cod";

      const res = await api.post("/orders", {
        restaurantId,
        items: cartItems.map((item) => ({
          dishId: item.dish._id,
          quantity: item.quantity,
        })),
        customerInfo: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
        },
        deliveryAddress: {
          street: deliveryLocation.trim(),
          location: deliveryLocation.trim(),
          name: customerName.trim(),
          phone: customerPhone.trim(),
        },
        paymentDetails: {
          method: paymentMethod,
          status: isPrepaid ? "paid" : "pending",
          transactionId: `${paymentMethod.toUpperCase()}-${Date.now()}`,
        },
      });

      setCart({});
      setPlacedOrder(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not place order right now. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };


  if (placedOrder) {
    return (
      <div className="zaika-card mx-auto max-w-2xl rounded-3xl p-8 text-center shadow-xl">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-green-50 text-green-600 shadow-sm">
          <Check className="h-8 w-8 stroke-[3]" />
        </span>
        <p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-[#15803d]">
          Order Confirmed
        </p>
        <h2 className="mt-2 text-3xl font-black text-[#251611]">
          Thank you for your order!
        </h2>
        <p className="mt-2 text-sm text-[#765f55]">
          Order <b className="text-[#251611]">#{placedOrder._id?.slice(-6).toUpperCase()}</b> has been sent to our kitchen.
        </p>

        {/* Receipt summary */}
        <div className="mt-6 rounded-2xl bg-[#fff8ed] p-5 text-left text-sm">
          <p className="border-b border-[#efd9bd] pb-2 font-black text-[#251611]">Order Breakdown</p>
          <div className="mt-3 space-y-2">
            {placedOrder.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-[#765f55]">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-bold text-[#251611]">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-[#efd9bd] pt-3 font-black text-[#251611]">
            <span>Total Paid</span>
            <span className="text-[#d9472b]">{formatCurrency(placedOrder.totalAmount || total)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[#765f55]">
            <span>Payment Method:</span>
            <span className="rounded-md bg-white px-2 py-1 font-black uppercase text-[#251611]">
              {placedOrder.paymentDetails?.method || paymentMethod} ({placedOrder.paymentDetails?.status || "confirmed"})
            </span>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/orders" className="zaika-button flex items-center gap-2 px-6 py-3">
            Track Your Order <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setPlacedOrder(null)}
            className="rounded-xl border border-[#efd9bd] px-5 py-3 text-sm font-bold text-[#765f55] hover:bg-[#fff1d5]"
          >
            Order More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_26rem] lg:items-start">
      {/* Menu Column */}
      <div>
        {/* Category and Veg Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition ${
                  selectedCategory === category
                    ? "bg-[#d9472b] text-white shadow-md"
                    : "border border-[#efd9bd] bg-[#fffdf8] text-[#765f55] hover:bg-[#fff1d5]"
                }`}
              >
                {category === "all" ? "All Dishes" : category}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-[#efd9bd] bg-[#fffdf8] px-3.5 py-2 text-xs font-bold text-[#765f55] cursor-pointer">
            <span className="h-3 w-3 rounded-full bg-green-600 inline-block" />
            <span>Veg Only</span>
            <input
              type="checkbox"
              checked={vegFilter}
              onChange={(e) => setVegFilter(e.target.checked)}
              className="h-4 w-4 accent-green-600"
            />
          </label>
        </div>

        {/* Dishes Grid */}
        {filteredDishes.length === 0 ? (
          <div className="zaika-card rounded-2xl p-10 text-center text-[#765f55]">
            No dishes match your filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {filteredDishes.map((dish) => {
              const quantity = cart[dish._id]?.quantity || 0;
              const isFavourite = favouriteIds.has(dish._id);

              return (
                <div
                  key={dish._id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#efd9bd] bg-[#fffdf8] shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-[#fff1d5]">
                    <img
                      src={dish.imageUrl || "/placeholder.jpg"}
                      alt={dish.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                    <span
                      className={`absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm ${
                        dish.isVeg ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {dish.isVeg ? "Veg" : "Non-Veg"}
                    </span>
                  </div>

                  <div className="flex flex-grow flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {dish.category && (
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#d9472b]">
                            {dish.category}
                          </p>
                        )}
                        <h3 className="text-lg font-black text-[#251611]">{dish.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFavourite(dish)}
                        className={`rounded-full border p-2 transition shrink-0 ${
                          isFavourite
                            ? "border-[#d9472b] bg-red-50 text-[#d9472b]"
                            : "border-[#efd9bd] text-[#765f55] hover:bg-[#fff1d5]"
                        }`}
                        title={isFavourite ? "Remove favourite" : "Add favourite"}
                      >
                        <Heart className={`h-4 w-4 ${isFavourite ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#765f55]">
                      {dish.description || "Prepared fresh upon order."}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="text-base font-black text-[#d9472b]">
                        {formatCurrency(dish.price)}
                      </span>

                      {quantity === 0 ? (
                        <button
                          type="button"
                          onClick={() => updateQuantity(dish, 1)}
                          className="zaika-button flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 rounded-xl border border-[#efd9bd] bg-[#fff8ed] p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(dish, -1)}
                            className="rounded-lg p-1.5 text-[#d9472b] hover:bg-[#fff1d5]"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-5 text-center text-xs font-black text-[#251611]">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(dish, 1)}
                            className="rounded-lg p-1.5 text-[#15803d] hover:bg-green-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart & Checkout Column */}
      <aside className="zaika-card sticky top-20 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#efd9bd] pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#d9472b]">Checkout</p>
            <h3 className="text-xl font-black text-[#251611]">Your Order ({itemCount})</h3>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff1d5] text-[#d9472b]">
            <ShoppingBag className="h-5 w-5" />
          </span>
        </div>

        {cartItems.length === 0 ? (
          <div className="my-6 rounded-2xl border border-dashed border-[#efd9bd] p-6 text-center text-sm text-[#765f55]">
            <Utensils className="mx-auto h-8 w-8 text-[#d9472b]/60 mb-2" />
            <p className="font-semibold">Your cart is empty</p>
            <p className="text-xs text-[#765f55]/80 mt-1">Select items from the menu to start your order.</p>
          </div>
        ) : (
          <div className="my-4 max-h-48 space-y-2.5 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div
                key={item.dish._id}
                className="flex items-center justify-between gap-2 rounded-xl bg-[#fff8ed] p-2.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-black text-[#251611] truncate">{item.dish.name}</p>
                  <p className="text-[#765f55]">{item.quantity} × {formatCurrency(item.dish.price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#d9472b]">
                    {formatCurrency(item.dish.price * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.dish, -item.quantity)}
                    className="p-1 text-[#765f55] hover:text-[#d9472b]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pricing Summary */}
        <div className="space-y-1.5 border-t border-[#efd9bd] pt-3 text-xs">
          <div className="flex justify-between text-[#765f55]">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#765f55]">
            <span>Delivery charge</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-[#251611] pt-1">
            <span>Total Payable</span>
            <span className="text-[#d9472b]">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Customer Details & Delivery Location */}
        <div className="mt-4 border-t border-[#efd9bd] pt-4">
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#765f55]">
            <MapPin className="h-3.5 w-3.5 text-[#d9472b]" /> Delivery & Contact Info
          </p>
          <div className="space-y-2">
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#765f55]" />
              <input
                type="text"
                required
                placeholder="Your Full Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="zaika-input text-xs py-2.5"
                style={{ paddingLeft: "2.85rem" }}
              />
            </div>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#765f55]" />
              <input
                type="tel"
                required
                placeholder="Phone / Mobile Number *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="zaika-input text-xs py-2.5"
                style={{ paddingLeft: "2.85rem" }}
              />
            </div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#765f55]" />
              <textarea
                required
                rows={2}
                placeholder="Delivery Location / Room / Landmark *"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                className="zaika-input text-xs py-2.5 resize-none"
                style={{ paddingLeft: "2.85rem" }}
              />
            </div>

          </div>
        </div>


        {/* ================= PAYMENT MODES ================= */}
        <div className="mt-4 border-t border-[#efd9bd] pt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#765f55]">
            Payment Mode
          </p>
          
          <div className="grid grid-cols-3 gap-1.5">
            {/* COD */}
            <button
              type="button"
              onClick={() => setPaymentMethod("cod")}
              className={`rounded-xl border p-2.5 text-center transition flex flex-col items-center gap-1 ${
                paymentMethod === "cod"
                  ? "border-[#d9472b] bg-[#fff1d5] text-[#d9472b] font-black shadow-sm"
                  : "border-[#efd9bd] bg-[#fffdf8] text-[#765f55] hover:bg-[#fff8ed]"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="text-[11px]">Cash on Delivery</span>
            </button>

            {/* UPI QR */}
            <button
              type="button"
              onClick={() => setPaymentMethod("upi")}
              className={`rounded-xl border p-2.5 text-center transition flex flex-col items-center gap-1 ${
                paymentMethod === "upi"
                  ? "border-[#d9472b] bg-[#fff1d5] text-[#d9472b] font-black shadow-sm"
                  : "border-[#efd9bd] bg-[#fffdf8] text-[#765f55] hover:bg-[#fff8ed]"
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span className="text-[11px]">UPI / QR Code</span>
            </button>

            {/* Online Card */}
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`rounded-xl border p-2.5 text-center transition flex flex-col items-center gap-1 ${
                paymentMethod === "card"
                  ? "border-[#d9472b] bg-[#fff1d5] text-[#d9472b] font-black shadow-sm"
                  : "border-[#efd9bd] bg-[#fffdf8] text-[#765f55] hover:bg-[#fff8ed]"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span className="text-[11px]">Card / Netbanking</span>
            </button>
          </div>

          {/* Payment Method Details / Interaction */}
          {paymentMethod === "upi" && (
            <div className="mt-3 rounded-2xl border border-[#efd9bd] bg-[#fffdf8] p-3 text-center">
              <p className="text-xs font-black text-[#251611]">Scan QR or Pay to UPI ID</p>
              
              {/* Simulated QR Visual */}
              <div className="my-2.5 mx-auto grid h-28 w-28 place-items-center rounded-xl border-2 border-dashed border-[#d9472b] bg-white p-2">
                <QrCode className="h-20 w-20 text-[#251611]" />
              </div>

              <div className="rounded-lg bg-[#fff8ed] p-1.5 text-[11px] font-mono font-bold text-[#d9472b]">
                zaika.restaurant@okaxis
              </div>

              <p className="mt-2 text-[11px] text-[#765f55]">
                GPay, PhonePe, Paytm or any UPI App accepted
              </p>
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="mt-3 space-y-2 rounded-2xl border border-[#efd9bd] bg-[#fffdf8] p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-[#251611]">Card Payment Details</p>
                <ShieldCheck className="h-4 w-4 text-[#15803d]" />
              </div>
              <input
                placeholder="Card Number (e.g. 4532 •••• •••• 8892)"
                value={cardDetails.number}
                onChange={(e) => setCardDetails((c) => ({ ...c, number: e.target.value }))}
                className="zaika-input text-xs py-1.5"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails((c) => ({ ...c, expiry: e.target.value }))}
                  className="zaika-input text-xs py-1.5"
                />
                <input
                  placeholder="CVV"
                  type="password"
                  maxLength={4}
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails((c) => ({ ...c, cvv: e.target.value }))}
                  className="zaika-input text-xs py-1.5"
                />
              </div>
            </div>
          )}

          {paymentMethod === "cod" && (
            <div className="mt-3 rounded-xl bg-[#fff8ed] p-2.5 text-xs text-[#765f55]">
              💵 Pay cash or scan QR when your delivery reaches your doorstep.
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={placeOrder}
          disabled={placingOrder || cartItems.length === 0}
          className="zaika-button mt-4 w-full py-3.5 font-bold shadow-md flex items-center justify-center gap-2"
        >
          {placingOrder ? (
            "Processing Order..."
          ) : (
            <>
              <span>Place Order · {formatCurrency(total)}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </aside>
    </div>
  );
}

