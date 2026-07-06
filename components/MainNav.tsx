"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

const navItems = [
  { href: "/", label: "Log" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/food-memory", label: "Food Memory" },
  { href: "/profile", label: "Profile" },
];

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-2 z-20 mt-4 grid grid-cols-2 gap-2 rounded-[1.5rem] border border-white/10 bg-slate-950/90 p-1.5 shadow-xl shadow-black/20 backdrop-blur sm:mt-5 sm:grid-cols-5 sm:rounded-[2rem]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "min-h-12 rounded-full bg-emerald-400 px-3 py-3 text-center text-sm font-black text-black shadow-lg shadow-emerald-400/15"
                : "min-h-12 rounded-full px-3 py-3 text-center text-sm font-bold text-slate-400 transition duration-200 hover:bg-white/[0.04] hover:text-white"
            }
          >
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={logout}
        className="min-h-12 rounded-full px-3 py-3 text-center text-sm font-bold text-slate-400 transition duration-200 hover:bg-white/[0.04] hover:text-white"
      >
        Logout
      </button>
    </nav>
  );
}
