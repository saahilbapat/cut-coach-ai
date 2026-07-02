"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

const navItems = [
  { href: "/", label: "Dashboard" },
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
    <nav className="mt-5 grid grid-cols-2 gap-2 rounded-[2rem] border border-white/10 bg-slate-950/80 p-1.5 shadow-xl shadow-black/20 backdrop-blur sm:grid-cols-4">
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
      <button
        type="button"
        onClick={logout}
        className="rounded-full px-3 py-3 text-center text-sm font-bold text-slate-400 transition duration-200 hover:bg-white/[0.04] hover:text-white"
      >
        Logout
      </button>
    </nav>
  );
}
