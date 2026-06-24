import { Link, useLocation } from "wouter";
import {
  Car,
  Wrench,
  Hammer,
  Tent,
  Lightbulb,
  Activity,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Vehicle", icon: Car },
  { path: "/service", label: "Service", icon: Wrench },
  { path: "/repairs", label: "Repairs", icon: Hammer },
  { path: "/camping", label: "Camping", icon: Tent },
  { path: "/lighting", label: "Lighting", icon: Lightbulb },
  { path: "/diagnostics", label: "Diag", icon: Activity },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-card border-t border-border flex items-center px-2 pb-safe z-50 overflow-x-auto">
      <div className="flex w-full min-w-max justify-around space-x-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path} className="flex-1">
              <div
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  "flex flex-col items-center justify-center h-20 w-16 rounded-xl transition-all duration-200 cursor-pointer touch-manipulation",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "w-7 h-7 mb-1",
                    isActive && "drop-shadow-[0_0_8px_rgba(0,112,192,0.5)]"
                  )}
                />
                <span className="text-[9px] font-medium tracking-wide uppercase">{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
