import { Link, useLocation } from "wouter";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SpotifyBubble() {
  const [location] = useLocation();
  const isActive = location === "/spotify";

  return (
    <Link href="/spotify" aria-label="Open Spotify controller">
      <div
        data-testid="spotify-floating-bubble"
        className={cn(
          "fixed bottom-28 right-4 z-[60] flex h-16 w-16 items-center justify-center rounded-full border shadow-2xl transition-all duration-200 touch-manipulation",
          "bg-[#1DB954] text-black border-[#1DB954]/80 shadow-[#1DB954]/25 hover:scale-105 active:scale-95",
          isActive && "ring-4 ring-[#1DB954]/30"
        )}
      >
        <Music2 className="h-8 w-8" />
      </div>
    </Link>
  );
}
