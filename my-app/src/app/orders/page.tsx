"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Clock3,
  CookingPot,
  MapPin,
  PartyPopper,
  Phone,
  Radio,
  ReceiptText,
  ShoppingBag,
  Truck,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { api } from "../lib/api";
import useAuthContext from "../hooks/useAuth";
import RestaurantLoader from "../components/RestaurantLoader";

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  price: number;
}

interface PaymentDetails {
  method?: "cod" | "upi" | "card" | "online";
  status?: "pending" | "paid" | "failed";
  transactionId?: string;
}

interface DeliveryAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
}

interface Order {
  _id: string;
  restaurantId?: { _id: string; name: string; logoUrl?: string };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  deliveryAddress?: DeliveryAddress;
  customerInfo?: { phone?: string; name?: string };
  paymentDetails?: PaymentDetails;
  createdAt: string;
}

interface LiveNotification {
  id: string;
  orderId: string;
  status: string;
  message: string;
  time: string;
}

const steps = ["placed", "accepted", "preparing", "out_for_delivery", "delivered"];

const stepDetails: Record<
  string,
  { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }
> = {
  placed: {
    label: "Order Placed",
    desc: "Order sent to kitchen, awaiting confirmation",
    icon: Clock3,
  },
  accepted: {
    label: "Accepted",
    desc: "Kitchen confirmed and scheduled your meal",
    icon: Check,
  },
  preparing: {
    label: "Cooking Now",
    desc: "Chef is freshly preparing your dishes with warm spices",
    icon: CookingPot,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    desc: "Delivery rider picked up your food and is on the way",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    desc: "Arrived at your location — enjoy your meal!",
    icon: PartyPopper,
  },
  cancelled: {
    label: "Cancelled",
    desc: "Order was cancelled by the kitchen",
    icon: AlertCircle,
  },
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const statusTone = (status: string) => {
  switch (status) {
    case "delivered":
      return "bg-green-50 text-green-700 border-green-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    case "preparing":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "out_for_delivery":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "accepted":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-[#fff1d5] text-[#d9472b] border-[#efd9bd]";
  }
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  // Real-time live notification states
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  const [liveToast, setLiveToast] = useState<LiveNotification | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Keep sound ref synced without re-triggering socket connections
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Web Audio API chime
  const playStatusChime = useCallback(() => {
    if (!soundEnabledRef.current) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Audio playback fallback / user interaction blocked
    }
  }, []);

  // Fetch initial orders
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .get("/orders/my")
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Could not load your orders. Please try again later."))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  // WebSocket Connection
  useEffect(() => {
    if (!user?._id) return;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:5004";
    const socket = io(apiBase, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join_user", user._id);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    const handleOrderUpdate = (updatedOrder: Order) => {
      if (!updatedOrder?._id) return;

      setOrders((prev) => {
        const index = prev.findIndex((o) => o._id === updatedOrder._id);
        if (index === -1) {
          return [updatedOrder, ...prev];
        }

        const oldStatus = prev[index].status;
        const newStatus = updatedOrder.status;

        if (oldStatus !== newStatus) {
          const detail = stepDetails[newStatus] || {
            label: newStatus.replace(/_/g, " "),
            desc: "Status updated",
          };

          setLiveToast({
            id: String(Date.now()),
            orderId: updatedOrder._id,
            status: newStatus,
            message: `Order #${updatedOrder._id.slice(-6).toUpperCase()} is now ${detail.label.toUpperCase()}! ${detail.desc}`,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          });

          playStatusChime();
        }

        const newArr = [...prev];
        newArr[index] = { ...newArr[index], ...updatedOrder };
        return newArr;
      });
    };

    socket.on("order_updated", handleOrderUpdate);
    socket.on("order_status_updated", (data: { order?: Order }) => {
      if (data?.order) handleOrderUpdate(data.order);
    });
    socket.on("order_status_changed", handleOrderUpdate);

    return () => {
      socket.disconnect();
    };
  }, [user?._id, playStatusChime]);

  // Auto-dismiss live toast
  useEffect(() => {
    if (!liveToast) return;
    const timer = setTimeout(() => setLiveToast(null), 8000);
    return () => clearTimeout(timer);
  }, [liveToast]);

  const activeOrders = useMemo(
    () => orders.filter((order) => !["delivered", "cancelled"].includes(order.status)),
    [orders]
  );

  const visibleOrders = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "active") return activeOrders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter, activeOrders]);

  if (authLoading || loading) return <RestaurantLoader label="Gathering your live orders" />;

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="zaika-card rounded-3xl p-10">
          <ReceiptText className="mx-auto h-11 w-11 text-[#d9472b]" />
          <h1 className="mt-4 text-3xl font-black text-[#251611]">Your orders, in one place</h1>
          <p className="mx-auto mt-3 max-w-md text-[#765f55]">
            Sign in to follow live on-time progress and revisit your favourite meals.
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
      {/* Toast Notification */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce rounded-3xl border-2 border-[#d9472b] bg-[#251611] p-5 text-white shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#d9472b] text-white shadow-md">
                <Bell className="h-5 w-5 animate-pulse" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#f8cd72]">
                  Live On-Time Order Update · {liveToast.time}
                </p>
                <p className="mt-1 text-sm font-bold leading-snug">{liveToast.message}</p>
              </div>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[#251611] p-7 text-white shadow-xl md:p-10">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border-[30px] border-[#f4a51c]/15" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                {socketConnected ? "Real-time Live Tracking Connected" : "Syncing Kitchen Updates..."}
              </span>
            </div>

            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
              title={soundEnabled ? "Mute notification chimes" : "Enable notification chimes"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-[#f8cd72]" /> Sound On
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-white/50" /> Sound Muted
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-5xl">Live Order Tracker</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                Follow real-time cooking progress from our kitchen to your doorstep.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">
                <p className="text-2xl font-black text-[#f8cd72]">{activeOrders.length}</p>
                <p className="text-xs font-bold text-white/65">In Kitchen</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">
                <p className="text-2xl font-black">{orders.length}</p>
                <p className="text-xs font-bold text-white/65">Total Orders</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}

      {orders.length === 0 ? (
        <div className="zaika-card mt-6 rounded-3xl p-10 text-center">
          <ShoppingBag className="mx-auto h-11 w-11 text-[#d9472b]" />
          <h2 className="mt-4 text-2xl font-black text-[#251611]">Your first order is waiting</h2>
          <p className="mx-auto mt-2 max-w-md text-[#765f55]">Explore today’s menu and we’ll track every live update right here.</p>
          <Link href="/menu" className="zaika-button mt-6 inline-flex items-center gap-2 px-6 py-3">
            View Menu & Order <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Status Filters */}
          <div className="mt-7 flex flex-wrap gap-2">
            {[
              ["all", `All Orders (${orders.length})`],
              ["active", `Live In Progress (${activeOrders.length})`],
              ["delivered", "Delivered"],
              ["cancelled", "Cancelled"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  filter === value
                    ? "bg-[#d9472b] text-white shadow-md"
                    : "border border-[#efd9bd] bg-[#fffdf8] text-[#765f55] hover:bg-[#fff1d5]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="mt-5 space-y-5">
            {visibleOrders.map((order) => {
              const activeIndex = steps.indexOf(order.status);
              const isOpen = openId === order._id;
              const method = order.paymentDetails?.method || "cod";
              const pStatus = order.paymentDetails?.status || (method === "cod" ? "pending" : "paid");
              const currentDetail = stepDetails[order.status] || {
                label: order.status.replace(/_/g, " "),
                desc: "Order is processing",
                icon: Clock3,
              };
              const StepIcon = currentDetail.icon;

              const formattedAddress = [
                order.deliveryAddress?.street,
                order.deliveryAddress?.city,
                order.deliveryAddress?.state,
                order.deliveryAddress?.zip,
              ]
                .filter(Boolean)
                .join(", ") || "Standard Delivery";

              const contactPhone = order.deliveryAddress?.phone || order.customerInfo?.phone;

              return (
                <article
                  key={order._id}
                  className="overflow-hidden rounded-3xl border border-[#efd9bd] bg-[#fffdf8] shadow-sm transition hover:shadow-md"
                >
                  <div className="p-5 md:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff1d5] text-[#d9472b]">
                          <StepIcon className="h-6 w-6" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-black text-[#251611]">
                              Order #{order._id.slice(-6).toUpperCase()}
                            </h2>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black capitalize flex items-center gap-1.5 ${statusTone(
                                order.status
                              )}`}
                            >
                              {!["delivered", "cancelled"].includes(order.status) && (
                                <span className="h-2 w-2 animate-ping rounded-full bg-current" />
                              )}
                              {currentDetail.label}
                            </span>
                            <span className="rounded-full border border-[#efd9bd] bg-white px-2.5 py-0.5 text-[11px] font-bold uppercase text-[#765f55]">
                              {method === "cod"
                                ? "💵 Cash on Delivery"
                                : method === "upi"
                                ? "📱 UPI QR"
                                : "💳 Card"}{" "}
                              · {pStatus === "paid" ? "✅ Paid" : "⏳ Payment Pending"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-[#765f55]">
                            {order.restaurantId?.name || "Park Paradise"}
                          </p>
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#765f55]">
                            <Clock3 className="h-3.5 w-3.5 text-[#d9472b]" />
                            {new Date(order.createdAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-5 md:block md:text-right">
                        <p className="text-2xl font-black text-[#251611]">{money(order.totalAmount)}</p>
                        <p className="mt-1 text-xs text-[#765f55]">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </p>
                      </div>
                    </div>

                    {/* Stepper */}
                    {order.status === "cancelled" ? (
                      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        This order was cancelled by the kitchen.
                      </div>
                    ) : (
                      <div className="mt-6 border-t border-[#efd9bd] pt-5">
                        <div className="grid grid-cols-5 gap-2">
                          {steps.map((step, index) => {
                            const done = activeIndex >= index;
                            const isCurrent = activeIndex === index;
                            const stepInfo = stepDetails[step];

                            return (
                              <div key={step} className="min-w-0">
                                <div
                                  className={`h-2.5 rounded-full transition-all duration-500 ${
                                    isCurrent
                                      ? "bg-[#d9472b] ring-4 ring-[#d9472b]/20"
                                      : done
                                      ? "bg-[#d9472b]"
                                      : "bg-[#efd9bd]"
                                  }`}
                                />
                                <p
                                  className={`mt-2 hidden text-[11px] font-bold capitalize sm:block ${
                                    isCurrent
                                      ? "text-[#d9472b] font-black"
                                      : done
                                      ? "text-[#251611]"
                                      : "text-[#765f55]/60"
                                  }`}
                                >
                                  {stepInfo.label}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3.5 flex items-center justify-between rounded-2xl bg-[#fff8ed] p-3 border border-[#efd9bd]">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#d9472b] text-white">
                              <StepIcon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-xs font-black text-[#251611]">{currentDetail.label}</p>
                              <p className="text-[11px] text-[#765f55]">{currentDetail.desc}</p>
                            </div>
                          </div>
                          {!["delivered", "cancelled"].includes(order.status) && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-[#d9472b]">
                              <Radio className="h-3.5 w-3.5 animate-pulse" /> Live
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setOpenId(isOpen ? null : order._id)}
                      className="mt-5 flex items-center gap-2 text-xs font-bold text-[#d9472b] hover:underline"
                    >
                      {isOpen ? "Hide order details" : "View order details & receipt"}
                      <ChevronDown className={`h-4 w-4 transition duration-300 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* Drawer */}
                  {isOpen && (
                    <div className="border-t border-[#efd9bd] bg-[#fff8ed] p-5 md:px-6 text-xs">
                      {order.deliveryAddress && (
                        <div className="mb-4 space-y-1.5 bg-[#fffdf8] p-3.5 rounded-2xl border border-[#efd9bd] text-xs text-[#765f55]">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#d9472b] shrink-0" />
                            <span>
                              Delivery Location: <b className="text-[#251611]">{formattedAddress}</b>
                            </span>
                          </div>
                          {contactPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[#d9472b] shrink-0" />
                              <span>
                                Contact Phone: <b className="text-[#251611]">{contactPhone}</b>
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="font-black text-[#251611] mb-2.5">Dishes in this order</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {order.items.map((item) => (
                          <div
                            key={item._id}
                            className="flex items-center justify-between rounded-xl bg-[#fffdf8] px-3.5 py-3 border border-[#efd9bd]"
                          >
                            <span>
                              <b className="text-[#251611]">{item.name}</b>
                              <span className="ml-2 text-[#765f55]">× {item.quantity}</span>
                            </span>
                            <b className="text-[#d9472b]">{money(item.price * item.quantity)}</b>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#efd9bd] pt-3 text-xs">
                        <span className="font-bold text-[#765f55]">Total Paid Amount</span>
                        <span className="text-base font-black text-[#251611]">{money(order.totalAmount)}</span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
