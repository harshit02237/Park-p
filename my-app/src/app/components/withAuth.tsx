"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";
import RestaurantLoader from "./RestaurantLoader";

export default function withAuth<P extends object = object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: "vendor" | "customer" | "admin"
) {
  const Protected: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          if (requiredRole === "admin") {
            router.replace("/admin/login");
          } else {
            router.replace("/login");
          }
        } else if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
          router.replace("/");
        }
      }
    }, [user, loading, router, requiredRole]);


    if (
      loading ||
      !user ||
      (requiredRole && user.role !== requiredRole && user.role !== "admin")
    ) {
      return <RestaurantLoader label="Checking your table" />;
    }

    return <WrappedComponent {...props} />;
  };

  Protected.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return Protected;
}
