"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavigationLoader() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const element = event.target as Element | null;
      const link = element?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
      setNavigating(true);
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (!navigating) return null;
  return (
    <div className="zaika-navigation-loader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="zaika-navigation-loader-card">
        <span className="zaika-navigation-spinner" />
      </div>
    </div>
  );
}
