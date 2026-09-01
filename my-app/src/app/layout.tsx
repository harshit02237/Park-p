import type { Metadata } from "next";
import "./styles/globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import NavigationLoader from "./components/NavigationLoader";
import { AuthProvider } from "./lib/auth";

export const metadata: Metadata = {
  title: "Park Paradise | Fresh Restaurant & Food Ordering",
  description: "Order fresh authentic dishes online with Cash on Delivery, UPI QR, and Card payments.",
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Header />
          <NavigationLoader />
          <main className="flex-1">{children}</main>
          <Chatbot />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
