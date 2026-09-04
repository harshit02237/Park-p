"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, CreditCard, Heart, MapPin, MessageCircle, QrCode, ReceiptText, Send, ShoppingBag, Utensils, X } from "lucide-react";
import { api } from "../lib/api";
import useAuthContext from "../hooks/useAuth";

interface Order {
  _id: string;
  status: string;
  totalAmount: number;
}

interface FavouriteDish {
  _id: string;
  name: string;
}

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
  actionHref?: string;
  actionLabel?: string;
}

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    text: "Namaste! I'm the Park Paradise assistant. How can I help you today? You can browse our menu, track live orders, or learn about payment options.",
  },

];

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default function Chatbot() {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favourites, setFavourites] = useState<FavouriteDish[]>([]);

  useEffect(() => {
    if (!user || user.role === "admin") {
      setOrders([]);
      setFavourites([]);
      return;
    }

    Promise.allSettled([api.get("/orders/my"), api.get("/favourites")]).then((results) => {
      const orderResult = results[0];
      const favouriteResult = results[1];

      if (orderResult.status === "fulfilled") {
        setOrders(Array.isArray(orderResult.value.data) ? orderResult.value.data : []);
      }

      if (favouriteResult.status === "fulfilled") {
        setFavourites(
          Array.isArray(favouriteResult.value.data) ? favouriteResult.value.data : []
        );
      }
    });
  }, [user]);

  const quickReplies = useMemo(() => {
    if (user?.role === "admin") {
      return [
        { label: "Kitchen Dashboard", value: "open admin dashboard" },
        { label: "Admin Settings", value: "open profile settings" },
      ];
    }
    return [
      { label: "Today's Menu", value: "show today's menu" },
      { label: "Track Order", value: "track my latest order" },
      { label: "Payment Modes", value: "what payment methods do you accept?" },
      { label: "Favourites", value: "show my favourite dishes" },
    ];
  }, [user?.role]);


  const replyTo = (text: string): ChatMessage => {
    const normalized = text.toLowerCase();

    if (normalized.includes("admin") || normalized.includes("dashboard") || normalized.includes("kitchen")) {
      return {
        role: "assistant",
        text: "Access the Live Orders Desk and Restaurant Catalogue from the Kitchen Dashboard.",
        actionHref: "/admin",
        actionLabel: "Open Kitchen Dashboard",
      };
    }


    if (normalized.includes("menu") || normalized.includes("dish") || normalized.includes("food") || normalized.includes("order")) {
      if (normalized.includes("track") || normalized.includes("status")) {
        if (!user) {
          return {
            role: "assistant",
            text: "Please sign in to track your live orders.",
            actionHref: "/login",
            actionLabel: "Sign In",
          };
        }

        const latestOrder = orders[0];
        if (!latestOrder) {
          return {
            role: "assistant",
            text: "You haven't placed an order yet. Check out our fresh menu!",
            actionHref: "/menu",
            actionLabel: "Browse Menu",
          };
        }

        return {
          role: "assistant",
          text: `Your latest order #${latestOrder._id.slice(-6).toUpperCase()} is currently ${formatStatus(latestOrder.status)}.`,
          actionHref: "/orders",
          actionLabel: "Track Live Order",
        };
      }

      return {
        role: "assistant",
        text: "Explore all our chef specials, starters, main courses, and desserts on our menu.",
        actionHref: "/menu",
        actionLabel: "Open Kitchen Menu",
      };
    }

    if (normalized.includes("deliver") || normalized.includes("charge") || normalized.includes("fee") || normalized.includes("free delivery") || normalized.includes("shipping")) {
      return {
        role: "assistant",
        text: "Delivery is FREE on all orders above ₹150! For orders up to ₹150, a standard delivery charge of ₹29 applies.",
        actionHref: "/menu",
        actionLabel: "Order with Free Delivery",
      };
    }

    if (normalized.includes("pay") || normalized.includes("upi") || normalized.includes("cod") || normalized.includes("card")) {
      return {
        role: "assistant",
        text: "We currently accept Cash on Delivery (COD). Online UPI QR and Cards are coming soon!",
        actionHref: "/menu",
        actionLabel: "Order Now",
      };
    }

    if (normalized.includes("fav") || normalized.includes("heart") || normalized.includes("saved")) {
      if (!user) {
        return {
          role: "assistant",
          text: "Sign in to save and view your favourite dishes.",
          actionHref: "/login",
          actionLabel: "Sign In",
        };
      }

      if (favourites.length === 0) {
        return {
          role: "assistant",
          text: "You don't have any saved favourites yet. Tap the heart on any dish on the menu!",
          actionHref: "/menu",
          actionLabel: "Browse Menu",
        };
      }

      return {
        role: "assistant",
        text: `You have saved ${favourites.length} favourite dishes (${favourites.slice(0, 3).map((f) => f.name).join(", ")}).`,
        actionHref: "/favourites",
        actionLabel: "Open Favourites",
      };
    }

    return {
      role: "assistant",
      text: "I can help you browse today's menu, check payment modes, or track your live order progress.",
      actionHref: "/menu",
      actionLabel: "Explore Menu",
    };
  };

  const sendMessage = (message = input) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      replyTo(trimmed),
    ]);
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section className="mb-3 flex h-[32rem] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-[#efd9bd] bg-[#fffdf8] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#efd9bd] p-4 bg-[#251611] text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d9472b] text-white shadow-sm">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-black text-sm text-white">Park Paradise Assistant</h2>
                <p className="text-[11px] font-semibold text-[#f8cd72]">Online & Ready</p>

              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-5 ${
                  message.role === "user"
                    ? "ml-auto bg-[#d9472b] text-white font-semibold"
                    : "bg-[#fff8ed] text-[#251611] border border-[#efd9bd]"
                }`}
              >
                <p>{message.text}</p>
                {message.actionHref && message.actionLabel && (
                  <Link
                    href={message.actionHref}
                    onClick={() => setOpen(false)}
                    className="mt-2.5 inline-flex rounded-xl bg-[#d9472b] px-3 py-1.5 text-[11px] font-black text-white shadow-sm hover:bg-[#b73521]"
                  >
                    {message.actionLabel}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[#efd9bd] p-3 bg-[#fffdf8]">
            <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {quickReplies.map((reply) => (
                <button
                  key={reply.value}
                  type="button"
                  onClick={() => sendMessage(reply.value)}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-[#efd9bd] bg-[#fff8ed] px-3 py-1.5 text-[11px] font-bold text-[#765f55] hover:bg-[#fff1d5]"
                >
                  {reply.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendMessage();
                }}
                placeholder="Ask about menu, orders, payments..."
                className="zaika-input text-xs"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                className="zaika-button flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="zaika-button flex h-14 w-14 items-center justify-center rounded-full shadow-2xl"
        aria-label="Open Zaika chat assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}

