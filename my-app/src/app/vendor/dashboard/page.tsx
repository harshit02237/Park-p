"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  CookingPot,
  CreditCard,
  Eye,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PackageCheck,
  Phone,
  QrCode,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  User,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import withAuth from "../../components/withAuth";
import { io, Socket } from "socket.io-client";
import RestaurantForm from "../../components/RestaurantForm";
import DishForm from "../../components/DishForm";
import { api } from "../../lib/api";
import RestaurantLoader from "../../components/RestaurantLoader";

interface Address { street?: string; city?: string; state?: string; zip?: string; }
interface Restaurant { _id: string; name: string; description: string; address?: Address; logoUrl?: string; cuisine?: string[]; openingHours?: string; isVeg: boolean; rating: number; }
interface OrderItem { _id?: string; name?: string; quantity: number; price?: number; }
interface PaymentDetails { method?: "cod" | "upi" | "card" | "online"; status?: "pending" | "paid" | "failed"; transactionId?: string; }
interface Order {
  _id: string;
  customerId?: { name?: string; email?: string; avatar?: string };
  restaurantId?: { _id?: string; name?: string };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  deliveryAddress?: Address;
  paymentDetails?: PaymentDetails;
  createdAt: string;
}

interface IncomingNotification {
  id: string;
  order: Order;
  timestamp: Date;
  read: boolean;
}

const orderStatuses = ["placed", "accepted", "preparing", "out_for_delivery", "delivered", "cancelled"];
const activeStatuses = ["placed", "accepted", "preparing", "out_for_delivery"];
const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const labelStatus = (status: string) => status.replaceAll("_", " ");
const statusClass = (status: string) => {
  switch (status) {
    case "delivered": return "bg-green-50 text-green-700 border-green-200";
    case "cancelled": return "bg-red-50 text-red-700 border-red-200";
    case "preparing": return "bg-amber-50 text-amber-700 border-amber-200";
    case "out_for_delivery": return "bg-blue-50 text-blue-700 border-blue-200";
    case "accepted": return "bg-purple-50 text-purple-700 border-purple-200";
    default: return "bg-[#fff1d5] text-[#d9472b] border-[#e6ceb0]";
  }
};

const paymentBadge = (payment?: PaymentDetails) => {
  const method = payment?.method || "cod";
  const status = payment?.status || (method === "cod" ? "pending" : "paid");

  let methodLabel = "Cash on Delivery";
  let icon = ShoppingBag;

  if (method === "upi") {
    methodLabel = "UPI QR";
    icon = QrCode;
  } else if (method === "card" || method === "online") {
    methodLabel = "Card / Online";
    icon = CreditCard;
  }

  const isPaid = status === "paid";
  const toneClass = isPaid ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200";

  return { methodLabel, icon, isPaid, toneClass, status };
};

const extractCustomerPhone = (order: any): string => {
  if (!order) return "";
  const phone =
    order.phone ||
    order.customerPhone ||
    order.customerInfo?.phone ||
    order.deliveryAddress?.phone ||
    order.deliveryPhone ||
    order.customerId?.phone;
  return phone && String(phone).trim() ? String(phone).trim() : "";
};

const extractCustomerName = (order: any): string => {
  if (!order) return "Customer";
  return (
    order.customerName ||
    order.customerInfo?.name ||
    order.deliveryAddress?.name ||
    order.customerId?.name ||
    "Customer"
  );
};

const extractCustomerLocation = (order: any): string => {
  if (!order) return "Standard Delivery";
  return (
    order.deliveryAddress?.location ||
    order.deliveryAddress?.street ||
    (typeof order.deliveryAddress === "string" ? order.deliveryAddress : "") ||
    order.location ||
    "Standard Delivery"
  );
};


// Web Audio API Synthesizer - Plays crisp restaurant kitchen bell alert
function playKitchenOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Melodic tri-tone kitchen chime (D5 -> A5 -> D6)
    playTone(587.33, now, 0.35);
    playTone(880.00, now + 0.14, 0.45);
    playTone(1174.66, now + 0.32, 0.7);
  } catch (e) {
    console.warn("Audio chime play error:", e);
  }
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = "tomato",
}: {
  label: string;
  value: string | number;
  icon: typeof BarChart3;
  tone?: "tomato" | "green" | "gold";
}) {
  const tones = {
    tomato: "bg-[#fff1d5] text-[#d9472b]",
    green: "bg-green-50 text-[#15803d]",
    gold: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-2xl border border-[#efd9bd] bg-[#fffdf8] p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#765f55]">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#251611]">{value}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function RestaurantAdminDashboard() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderQuery, setOrderQuery] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // In-App Real-time Notification State
  const [notifications, setNotifications] = useState<IncomingNotification[]>([]);
  const [activeToast, setActiveToast] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial Restaurant Profile Fetch
  useEffect(() => {
    const controller = new AbortController();
    api
      .get("/restaurants/current", { signal: controller.signal })
      .then((res) => setRestaurant(res.data))
      .catch(() => {
        api
          .get("/restaurants/vendor/me", { signal: controller.signal })
          .then((res) => setRestaurant(res.data))
          .catch((err) => {
            if (err.name !== "CanceledError") setRestaurant(null);
          });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  // Fetch Orders
  const fetchOrders = () => {
    const controller = new AbortController();
    setOrdersLoading(true);
    api
      .get("/orders/admin/all", { signal: controller.signal })
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => {
        const restId = restaurant?._id || "all";
        api
          .get(`/orders/vendor/${restId}`, { signal: controller.signal })
          .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
          .catch(() => setOrders([]));
      })
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    // Periodic background sync fallback
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, [restaurant?._id]);

  // Real-Time Socket.IO In-App Notifications
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:5004";
    const socket: Socket = io(base, { withCredentials: true, transports: ["websocket", "polling"] });

    socket.emit("join_admin");
    if (restaurant?._id) {
      socket.emit("join_restaurant", restaurant._id);
    }

    const handleNewOrder = (newOrder: Order) => {
      // 1. Play kitchen bell sound if sound enabled
      if (soundEnabled) {
        playKitchenOrderChime();
      }

      // 2. Add to orders list (avoid duplicates)
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === newOrder._id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });

      // 3. Add to In-App Notification Center
      const newNotif: IncomingNotification = {
        id: `notif-${Date.now()}-${newOrder._id}`,
        order: newOrder,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // 4. Show Floating In-App Notification Banner Toast
      setActiveToast(newOrder);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setActiveToast(null);
      }, 10000);
    };

    socket.on("new_order", handleNewOrder);
    socket.on("new_order_admin", handleNewOrder);
    socket.on("new_order_broadcast", handleNewOrder);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("new_order_admin", handleNewOrder);
      socket.off("new_order_broadcast", handleNewOrder);
      socket.disconnect();
    };
  }, [restaurant?._id, soundEnabled]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const metrics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "cancelled");
    const revenue = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const active = orders.filter((o) => activeStatuses.includes(o.status)).length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const average = validOrders.length ? Math.round(revenue / validOrders.length) : 0;
    return { revenue, active, delivered, average };
  }, [orders]);

  const recentOrders = orders.slice(0, 5);
  const visibleOrders = orders.filter((order) => {
    const matchesFilter = orderFilter === "all" || order.status === orderFilter;
    const queryLower = orderQuery.toLowerCase();
    const searchTarget = `${order._id} ${order.customerId?.name || ""} ${order.customerId?.email || ""} ${order.deliveryAddress?.city || ""}`.toLowerCase();
    return matchesFilter && searchTarget.includes(queryLower);
  });

  const updateStatus = async (orderId: string, status: string) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await api.put(`/orders/${orderId}/status`, { status });
      setOrders((current) => current.map((order) => (order._id === orderId ? res.data : order)));
      if (activeToast?._id === orderId) {
        setActiveToast(null);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Cannot change or reverse this order state.");
    } finally {
      setUpdatingOrderId(null);
    }
  };


  const updatePaymentStatus = async (orderId: string, paymentStatus: "paid" | "pending") => {
    try {
      setUpdatingOrderId(orderId);
      const res = await api.put(`/orders/${orderId}/status`, { paymentStatus });
      setOrders((current) => current.map((order) => (order._id === orderId ? res.data : order)));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("zaika_token");
    window.location.href = "/";
  };

  const navigate = (section: string) => {
    setActiveSection(section);
    setSidebarOpen(false);
    if (section !== "profile") setIsEditingProfile(false);
  };

  if (loading) return <RestaurantLoader label="Opening Restaurant Admin Workspace" />;

  const navigation = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "manageDishes", label: "Menu Catalogue", icon: UtensilsCrossed },
    { id: "orders", label: "Live Orders", icon: ClipboardList, badge: metrics.active },
    { id: "profile", label: "Restaurant Settings", icon: Store },
  ];

  return (
    <div className="relative mx-auto min-h-[calc(100vh-73px)] max-w-7xl px-4 py-6 lg:py-8">
      {/* ================= FLOATING IN-APP ORDER NOTIFICATION TOAST ================= */}
      {activeToast && (
        <div className="fixed right-4 top-20 z-50 w-96 max-w-[calc(100vw-2rem)] animate-bounce-short overflow-hidden rounded-3xl border-2 border-[#d9472b] bg-[#251611] p-5 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d9472b] text-white shadow-md animate-pulse">
                <Bell className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-[#f8cd72]">
                  New Customer Order!
                </p>
                <p className="text-base font-black">
                  #{activeToast._id.slice(-6).toUpperCase()} · {formatMoney(activeToast.totalAmount)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 rounded-2xl bg-white/10 p-3 text-xs space-y-1">
            <p className="font-semibold text-white/90">
              Customer: <b className="text-white">{extractCustomerName(activeToast)}</b>
            </p>
            {extractCustomerPhone(activeToast) && (
              <p className="text-[#f8cd72] font-bold">
                Phone: {extractCustomerPhone(activeToast)}
              </p>
            )}
            <p className="text-white/80">
              Location: {extractCustomerLocation(activeToast)}
            </p>
            <p className="text-white/70 pt-1">
              {activeToast.items.length} items ({activeToast.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")})
            </p>

            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[11px] font-bold">
              <span className="text-[#f8cd72]">
                Payment: {activeToast.paymentDetails?.method?.toUpperCase() || "COD"}
              </span>
              <span className="text-white/60">Just now</span>
            </div>
          </div>


          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                updateStatus(activeToast._id, "accepted");
                setActiveToast(null);
              }}
              className="zaika-button flex-1 py-2 text-xs font-bold"
            >
              Accept Order
            </button>
            <button
              onClick={() => {
                navigate("orders");
                setActiveToast(null);
              }}
              className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
            >
              View Orders
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar for Mobile & Quick Actions */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-2xl border border-[#efd9bd] bg-[#fffdf8] p-2.5 text-[#251611] lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div>
            <h1 className="text-xl font-black text-[#251611] md:text-2xl">
              {restaurant?.name || "Zaika"} Admin Portal
            </h1>
            <p className="text-xs font-semibold text-[#765f55]">Single-Restaurant Kitchen Command Centre</p>
          </div>
        </div>

        {/* Right Tools: Notification Center & Sound Toggle */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playKitchenOrderChime();
            }}
            title={soundEnabled ? "Mute order sound" : "Unmute order chime"}
            className={`rounded-2xl border p-2.5 transition flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-[#efd9bd] bg-[#fffdf8] text-[#765f55]"
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{soundEnabled ? "Sound ON" : "Muted"}</span>
          </button>

          {/* In-App Notification Center Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotificationCenter(!showNotificationCenter);
                if (!showNotificationCenter) markAllNotificationsAsRead();
              }}
              className="relative rounded-2xl border border-[#efd9bd] bg-[#fffdf8] p-2.5 text-[#251611] transition hover:bg-[#fff1d5]"
              title="Order Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#d9472b] text-[10px] font-black text-white shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotificationCenter && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-3xl border border-[#efd9bd] bg-[#fffdf8] p-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#efd9bd] pb-3">
                  <p className="font-black text-[#251611]">Order Alerts ({notifications.length})</p>
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs font-bold text-[#d9472b] hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[#765f55]">
                      No new order alerts yet.
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          navigate("orders");
                          setShowNotificationCenter(false);
                        }}
                        className="cursor-pointer rounded-2xl border border-[#efd9bd] bg-[#fff8ed] p-3 text-xs transition hover:bg-[#fff1d5]"
                      >
                        <div className="flex items-center justify-between font-black text-[#251611]">
                          <span>Order #{notif.order._id.slice(-6).toUpperCase()}</span>
                          <span className="text-[#d9472b]">{formatMoney(notif.order.totalAmount)}</span>
                        </div>
                        <p className="mt-1 text-[#765f55]">
                          {notif.order.customerId?.name || "Customer"} · {notif.order.items.length} items
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        {/* Sidebar Nav */}
        <aside
          className={`${
            sidebarOpen ? "block" : "hidden"
          } zaika-card rounded-3xl p-4 lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-8rem)]`}
        >
          <div className="flex items-center gap-3 border-b border-[#efd9bd] p-2 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d9472b] text-white shadow-md">
              <CookingPot className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black text-[#251611]">{restaurant?.name || "Restaurant Admin"}</p>
              <p className="text-[11px] font-bold text-[#765f55]">Owner Dashboard</p>
            </div>
          </div>

          <nav className="mt-4 space-y-1.5">
            {navigation.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left text-sm font-bold transition ${
                  activeSection === id
                    ? "bg-[#251611] text-white shadow-md"
                    : "text-[#765f55] hover:bg-[#fff1d5] hover:text-[#d9472b]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                {badge !== undefined && badge > 0 && (
                  <span className="rounded-full bg-[#d9472b] px-2 py-0.5 text-xs font-black text-white">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <button
            onClick={logout}
            className="mt-8 flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 lg:mt-auto"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        {/* Dynamic Section Content */}
        <main className="min-w-0">
          {/* ================= OVERVIEW ================= */}
          {activeSection === "overview" && (
            <section>
              <div className="relative overflow-hidden rounded-3xl bg-[#251611] p-7 text-white shadow-xl md:p-9">
                <div className="pointer-events-none absolute -right-12 -top-14 h-56 w-56 rounded-full border-[26px] border-[#f4a51c]/15" />
                <div className="relative">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#f8cd72]">
                    <Sparkles className="h-4 w-4" /> Kitchen Command Desk
                  </p>
                  <h1 className="mt-3 text-3xl font-black md:text-4xl">
                    {restaurant ? `Welcome, ${restaurant.name}` : "Set up your restaurant."}
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                    Live order alerts, kitchen dispatch, and menu controls for your restaurant.
                  </p>
                </div>
              </div>

              {!restaurant ? (
                <div className="mt-6">
                  <RestaurantForm onSuccess={setRestaurant} />
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Stat label="Total Order Sales" value={formatMoney(metrics.revenue)} icon={BarChart3} />
                    <Stat label="Active Orders" value={metrics.active} icon={Clock3} tone="gold" />
                    <Stat label="Completed Orders" value={metrics.delivered} icon={PackageCheck} tone="green" />
                    <Stat label="Average Ticket" value={formatMoney(metrics.average)} icon={ClipboardList} />
                  </div>

                  {/* Recent Live Orders & Profile Widget */}
                  <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
                    <div className="rounded-3xl border border-[#efd9bd] bg-[#fffdf8] p-5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-[#efd9bd] pb-4">
                        <div>
                          <h2 className="text-xl font-black text-[#251611]">Recent Orders</h2>
                          <p className="text-xs text-[#765f55]">Incoming orders from hungry customers</p>
                        </div>
                        <button
                          onClick={() => navigate("orders")}
                          className="flex items-center gap-1 text-xs font-bold text-[#d9472b] hover:underline"
                        >
                          View all <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {ordersLoading ? (
                          <p className="py-8 text-center text-sm text-[#765f55]">Loading orders…</p>
                        ) : recentOrders.length ? (
                          recentOrders.map((order) => {
                            const pBadge = paymentBadge(order.paymentDetails);
                            return (
                              <div
                                key={order._id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#fff8ed] p-3.5 transition hover:shadow-sm"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-black text-[#251611]">
                                      #{order._id.slice(-6).toUpperCase()}
                                    </p>
                                    <span className="font-bold text-xs text-[#251611]">
                                      {extractCustomerName(order)}
                                    </span>
                                  </div>
                                  {extractCustomerPhone(order) && (
                                    <p className="mt-0.5 text-[11px] font-semibold text-[#d9472b]">
                                      📞 {extractCustomerPhone(order)}
                                    </p>
                                  )}
                                  <p className="text-[11px] text-[#765f55] truncate max-w-xs">
                                    📍 {extractCustomerLocation(order)}
                                  </p>
                                  <p className="mt-1 text-[11px] text-[#765f55]/80">
                                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items ·{" "}
                                    {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>


                                <div className="text-right">
                                  <p className="font-black text-[#251611]">{formatMoney(order.totalAmount)}</p>
                                  <div className="mt-1 flex items-center gap-1.5 justify-end">
                                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-black capitalize ${statusClass(order.status)}`}>
                                      {labelStatus(order.status)}
                                    </span>
                                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${pBadge.toneClass}`}>
                                      {pBadge.methodLabel}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="rounded-2xl bg-[#fff8ed] p-6 text-center text-sm text-[#765f55]">
                            No orders received yet. New orders will pop up here live!
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Restaurant Profile Status */}
                    <div className="overflow-hidden rounded-3xl border border-[#efd9bd] bg-[#fffdf8] shadow-sm">
                      <div className="relative h-36 bg-[#251611]">
                        {restaurant.logoUrl && (
                          <img
                            src={restaurant.logoUrl}
                            alt="Restaurant"
                            className="h-full w-full object-cover opacity-60"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#251611] to-transparent" />
                      </div>
                      <div className="relative p-5">
                        <span className="absolute -top-7 grid h-14 w-14 place-items-center rounded-2xl border-4 border-[#fffdf8] bg-[#d9472b] text-white shadow-md">
                          <Store className="h-6 w-6" />
                        </span>
                        <p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-[#d9472b]">
                          Kitchen Storefront
                        </p>
                        <h2 className="mt-1 text-xl font-black text-[#251611]">{restaurant.name}</h2>
                        <p className="mt-1 line-clamp-2 text-xs text-[#765f55]">{restaurant.description}</p>
                        
                        <div className="mt-4 border-t border-[#efd9bd] pt-3 text-xs text-[#765f55] space-y-1">
                          <p className="flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5 text-[#d9472b]" /> {restaurant.openingHours || "Hours not set"}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#d9472b]" /> {[restaurant.address?.street, restaurant.address?.city].filter(Boolean).join(", ") || "Address not set"}
                          </p>
                        </div>

                        <button
                          onClick={() => navigate("profile")}
                          className="mt-4 flex items-center gap-1 text-xs font-bold text-[#d9472b] hover:underline"
                        >
                          Edit Profile Settings <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ================= MANAGE MENU ================= */}
          {activeSection === "manageDishes" && (
            <section>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#d9472b]">Kitchen Catalogue</p>
                  <h1 className="mt-1 text-3xl font-black text-[#251611]">Manage Menu Dishes</h1>
                  <p className="mt-1 text-sm text-[#765f55]">Add, edit, upload pictures, and set prices for your menu.</p>
                </div>
              </div>
              <div className="mt-6">
                {restaurant ? <DishForm restaurantId={restaurant._id} /> : <RestaurantForm onSuccess={setRestaurant} />}
              </div>
            </section>
          )}

          {/* ================= LIVE ORDERS ================= */}
          {activeSection === "orders" && (
            <section>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#d9472b]">Kitchen Dispatch</p>
                  <h1 className="mt-1 text-3xl font-black text-[#251611]">Live Orders Desk</h1>
                  <p className="mt-1 text-sm text-[#765f55]">Receive instant customer orders and update progress.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#fff1d5] px-3.5 py-1.5 text-xs font-black text-[#d9472b]">
                    {metrics.active} active orders
                  </span>
                </div>
              </div>

              {/* Filter and Search */}
              <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#efd9bd] bg-[#fffdf8] p-3 sm:flex-row">
                <label className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d9472b]" />
                  <input
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    placeholder="Search by order #, customer name, phone, location..."
                    className="zaika-input text-xs"
                    style={{ paddingLeft: "2.85rem" }}
                  />
                </label>

                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="zaika-input sm:w-48 text-xs font-bold"
                >
                  <option value="all">All Statuses</option>
                  {orderStatuses.map((st) => (
                    <option key={st} value={st}>
                      {labelStatus(st)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Cards List */}
              <div className="mt-5 space-y-4">
                {ordersLoading ? (
                  <div className="zaika-card rounded-2xl p-8 text-center text-[#765f55]">Loading orders…</div>
                ) : visibleOrders.length ? (
                  visibleOrders.map((order) => {
                    const pBadge = paymentBadge(order.paymentDetails);
                    return (
                      <article
                        key={order._id}
                        className="rounded-3xl border border-[#efd9bd] bg-[#fffdf8] p-5 shadow-sm transition hover:shadow"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-lg font-black text-[#251611]">
                                Order #{order._id.slice(-6).toUpperCase()}
                              </h2>
                              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-black capitalize ${statusClass(order.status)}`}>
                                {labelStatus(order.status)}
                              </span>
                              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold flex items-center gap-1 ${pBadge.toneClass}`}>
                                <pBadge.icon className="h-3.5 w-3.5" />
                                {pBadge.methodLabel} ({pBadge.status.toUpperCase()})
                              </span>
                            </div>

                            {/* Customer Details - Clean Vertical List */}
                            <div className="mt-3 space-y-1.5 rounded-2xl bg-[#fff8ed] p-3.5 text-xs text-[#251611] border border-[#efd9bd]">
                              {/* 1. Name */}
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-[#765f55] min-w-[70px]">Name:</span>
                                <span className="font-black text-sm text-[#251611]">
                                  {extractCustomerName(order)}
                                  {order.customerId?.email && (
                                    <span className="ml-2 font-normal text-xs text-[#765f55]">
                                      ({order.customerId.email})
                                    </span>
                                  )}
                                </span>
                              </div>

                              {/* 2. Number / Phone */}
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#765f55] min-w-[70px]">Number:</span>
                                {extractCustomerPhone(order) ? (
                                  <a
                                    href={`tel:${extractCustomerPhone(order)}`}
                                    className="font-black text-sm text-[#d9472b] hover:underline flex items-center gap-1"
                                  >
                                    📞 {extractCustomerPhone(order)}
                                  </a>
                                ) : (
                                  <span className="font-semibold text-xs text-[#765f55]">Not provided</span>
                                )}
                              </div>

                              {/* 3. Location */}
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-[#765f55] min-w-[70px]">Location:</span>
                                <span className="font-bold text-xs text-[#251611]">
                                  📍 {extractCustomerLocation(order)}
                                </span>
                              </div>

                              {/* 4. Placed At */}
                              <div className="flex items-center gap-2 pt-1 border-t border-[#efd9bd]/60 text-[11px] text-[#765f55]">
                                <span className="font-bold min-w-[70px]">Placed at:</span>
                                <span>
                                  {new Date(order.createdAt).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>



                          <div className="flex flex-col items-end gap-3">
                            <p className="text-2xl font-black text-[#251611]">{formatMoney(order.totalAmount)}</p>
                            
                            <div className="flex flex-wrap gap-2">
                              {/* Order Status Selector - Locked once delivered or cancelled */}
                              {["delivered", "cancelled"].includes(order.status) ? (
                                <span
                                  className={`rounded-xl border px-3 py-2 text-xs font-black capitalize flex items-center gap-1.5 ${statusClass(
                                    order.status
                                  )}`}
                                  title="Finalized order state cannot be changed or reversed"
                                >
                                  🔒 {labelStatus(order.status)} (Locked)
                                </span>
                              ) : (
                                <select
                                  value={order.status}
                                  disabled={updatingOrderId === order._id}
                                  onChange={(e) => updateStatus(order._id, e.target.value)}
                                  className="zaika-input py-2 text-xs font-bold capitalize w-40"
                                >
                                  {orderStatuses.map((st) => (
                                    <option key={st} value={st}>
                                      {labelStatus(st)}
                                    </option>
                                  ))}
                                </select>
                              )}


                              {/* Toggle Paid status button for COD / pending orders */}
                              {!pBadge.isPaid ? (
                                <button
                                  type="button"
                                  onClick={() => updatePaymentStatus(order._id, "paid")}
                                  disabled={updatingOrderId === order._id}
                                  className="rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100"
                                >
                                  Mark as Paid
                                </button>
                              ) : (
                                <span className="rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-green-700 border border-green-200">
                                  ✓ Paid
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#efd9bd] pt-3">
                          {order.items.map((item, idx) => (
                            <span
                              key={item._id || idx}
                              className="rounded-xl bg-[#fff8ed] px-3 py-1.5 text-xs text-[#765f55]"
                            >
                              <b className="text-[#251611]">{item.name || "Dish"}</b> · {item.quantity} × {formatMoney(item.price || 0)}
                            </span>
                          ))}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="zaika-card rounded-2xl p-10 text-center text-[#765f55]">
                    No orders match your filter.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= PROFILE SETTINGS ================= */}
          {activeSection === "profile" && (
            <section>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#d9472b]">Restaurant Configuration</p>
                  <h1 className="mt-1 text-3xl font-black text-[#251611]">Restaurant Profile</h1>
                  <p className="mt-1 text-sm text-[#765f55]">Customer-facing information and restaurant details.</p>
                </div>
                {restaurant && !isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="zaika-button px-5 py-2.5 text-xs font-bold"
                  >
                    Edit Restaurant Profile
                  </button>
                )}
              </div>

              {!restaurant ? (
                <div className="mt-6">
                  <RestaurantForm onSuccess={setRestaurant} />
                </div>
              ) : isEditingProfile ? (
                <div className="mt-6">
                  <RestaurantForm
                    mode="edit"
                    initialRestaurant={restaurant}
                    onSuccess={(data) => {
                      setRestaurant(data);
                      setIsEditingProfile(false);
                    }}
                    onCancel={() => setIsEditingProfile(false)}
                  />
                </div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-3xl border border-[#efd9bd] bg-[#fffdf8] shadow-sm">
                  <div className="relative h-56 bg-[#251611]">
                    {restaurant.logoUrl ? (
                      <img
                        src={restaurant.logoUrl}
                        alt={restaurant.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-white/50">
                        <Store className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                    <div className="absolute bottom-5 left-6 text-white">
                      <h2 className="text-3xl font-black">{restaurant.name}</h2>
                      <p className="mt-1 text-xs text-white/75">{restaurant.cuisine?.join(" · ") || "Cuisine not set"}</p>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6 md:grid-cols-[1.25fr_.75fr]">
                    <div>
                      <h3 className="font-black text-[#251611]">About the Restaurant</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#765f55]">{restaurant.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {restaurant.cuisine?.map((c) => (
                          <span key={c} className="rounded-full bg-[#fff1d5] px-3 py-1 text-xs font-bold text-[#d9472b]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#fff8ed] p-5 text-xs space-y-3">
                      <div>
                        <p className="font-black text-[#251611] flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-[#d9472b]" /> Address
                        </p>
                        <p className="mt-1 text-[#765f55] leading-5">
                          {[restaurant.address?.street, restaurant.address?.city, restaurant.address?.state, restaurant.address?.zip].filter(Boolean).join(", ") || "Address not configured"}
                        </p>
                      </div>

                      <div>
                        <p className="font-black text-[#251611] flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4 text-[#d9472b]" /> Hours of Operation
                        </p>
                        <p className="mt-1 text-[#765f55]">{restaurant.openingHours || "Hours not set"}</p>
                      </div>

                      <div>
                        <p className="font-black text-[#251611] flex items-center gap-1.5">
                          <Star className="h-4 w-4 fill-[#f4a51c] text-[#f4a51c]" /> Customer Rating
                        </p>
                        <p className="mt-1 text-[#765f55]">{restaurant.rating || "4.8 out of 5.0"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default withAuth(RestaurantAdminDashboard, "admin");

