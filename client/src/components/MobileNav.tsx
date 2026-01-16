import { Link, useLocation } from "wouter";
import { Home, BarChart3, Settings, Plus, Play } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImportDialog } from "@/components/ImportDialog";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/results", icon: BarChart3, label: "Historial" },
];

export function MobileNav() {
  const [location] = useLocation();
  const [showTestSelector, setShowTestSelector] = useState(false);

  const isActiveRoute = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:hidden"
        data-testid="mobile-nav"
      >
        <div className="flex items-center justify-around px-2 py-2 safe-area-pb relative">
          {/* Left side nav items */}
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[64px]",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}

          {/* Center play button - floating above */}
          <Link href="/">
            <button
              className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
              data-testid="nav-start-test"
            >
              <Play className="h-6 w-6 ml-0.5" />
            </button>
          </Link>

          {/* Spacer for center button */}
          <div className="w-14" />

          {/* Right side items */}
          <Link href="/admin">
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[64px]",
                isActiveRoute("/admin")
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              data-testid="nav-admin"
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs font-medium">Admin</span>
            </button>
          </Link>

          {/* Add test button (replaces Online indicator) */}
          <ImportDialog trigger={
            <button
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50 min-w-[64px]"
              data-testid="nav-add-test"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium">Añadir</span>
            </button>
          } />
        </div>
      </nav>
    </>
  );
}
