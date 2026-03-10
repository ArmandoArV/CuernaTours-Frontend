"use client";

import { usePathname } from "next/navigation";

/**
 * Replays a fade-slide-up animation every time the route changes.
 * The `key={pathname}` forces React to unmount and remount the inner div,
 * which restarts the CSS animation defined in globals.css.
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="anim-enter">
      {children}
    </div>
  );
}
