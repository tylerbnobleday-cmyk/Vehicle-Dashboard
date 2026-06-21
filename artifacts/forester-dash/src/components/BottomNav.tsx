import { Link, useLocation } from "wouter";
import {
  Home,
  Car,
  Gauge,
  Wrench,
  CircleDashed,
  Hammer,
  Tent,
  Lightbulb,
  Activity,
  Settings,
  Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dash", icon: Home },
  { path: "/vehicle", label: "Vehicle", icon: Car },
  { path: "/speedometer", label: "Speed", icon: Gauge },
  { path: "/service", label: "Service", icon: Wrench },
  { path: "/tyres", label: "Tyres", icon: CircleDashed },
  { path: "/repairs", label: "Repairs", icon: Hammer },
  { path: "/camping", label: "Camping", icon: Tent },
  { path: "/lighting", label: "Lighting", icon: Lightbulb },
  { path: "/spotify", label: "Spotify", icon: Music2 },
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
          const isSpotify = path === "/spotify";
          return (
            <Link key={path} href={path} className="flex-1">
              <div
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  "flex flex-col items-center justify-center h-20 w-16 rounded-xl transition-all duration-200 cursor-pointer touch-manipulation",
                  isActive
                    ? isSpotify
                      ? "bg-[#1DB954]/20 text-[#1DB954]"
                      : "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "w-7 h-7 mb-1",
                    isActive && !isSpotify && "drop-shadow-[0_0_8px_rgba(0,112,192,0.5)]",
                    isActive && isSpotify && "drop-shadow-[0_0_8px_rgba(29,185,84,0.5)]"
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
