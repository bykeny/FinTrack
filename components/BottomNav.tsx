"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  Receipt,
  Target,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Shifts", href: "/shifts", icon: Clock },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom navigation on auth pages
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <nav
      id="bottom-nav"
      className="glass fixed bottom-0 left-0 right-0 z-50 border-t border-nav-border pb-safe"
      role="navigation"
      aria-label="Main navigation"
    >
      <ul className="mx-auto flex max-w-lg items-center justify-around px-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                id={`nav-${label.toLowerCase()}`}
                className={`
                  group flex min-h-[48px] min-w-[48px] flex-col items-center
                  justify-center gap-0.5 rounded-xl px-2 py-1.5
                  transition-all duration-200
                  ${
                    isActive
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    className="transition-all duration-200 group-hover:scale-110"
                  />
                  {/* Active dot indicator */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent animate-pulse-glow" />
                  )}
                </span>
                <span
                  className={`text-[10px] font-medium leading-tight transition-all duration-200 ${
                    isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
