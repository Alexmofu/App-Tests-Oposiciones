import { Link, useLocation } from "wouter";
import { Home, BarChart3, Settings, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/results", icon: BarChart3, label: "Historial" },
  { href: "/admin", icon: Settings, label: "Admin" },
];

export function MobileNav() {
  const [location] = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const isActiveRoute = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:hidden"
      data-testid="mobile-nav"
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => {
          const isActive = isActiveRoute(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[72px]",
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
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[72px]"
          )}
          data-testid="nav-connection-status"
        >
          {isOnline ? (
            <>
              <Wifi className="h-5 w-5 text-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                Online
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 text-orange-500" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                Offline
              </span>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
