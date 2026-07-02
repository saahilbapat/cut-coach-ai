"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/food-memory", label: "Food Memory" },
  { href: "/profile", label: "Profile" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-5 grid grid-cols-3 gap-2 rounded-full border border-white/10 bg-slate-950/80 p-1.5 shadow-xl shadow-black/20 backdrop-blur">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "rounded-full bg-emerald-400 px-3 py-3 text-center text-sm font-black text-black shadow-lg shadow-emerald-400/15"
                : "rounded-full px-3 py-3 text-center text-sm font-bold text-slate-400 transition duration-200 hover:bg-white/[0.04] hover:text-white"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
