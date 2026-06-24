import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { BottomNav } from "@/components/BottomNav";
import { SpotifyBubble } from "@/components/SpotifyBubble";
import { AlertSystem } from "@/components/AlertSystem";
import Vehicle from "@/pages/Vehicle";
import Service from "@/pages/Service";
import Repairs from "@/pages/Repairs";
import Camping from "@/pages/Camping";
import Lighting from "@/pages/Lighting";
import Diagnostics from "@/pages/Diagnostics";
import Reminders from "@/pages/Reminders";
import Settings from "@/pages/Settings";
import Spotify from "@/pages/Spotify";

const queryClient = new QueryClient();
const JAM_INVITE_PATTERN = /https:\/\/open\.spotify\.com\/socialsession\/[^\s]+/i;

function saveJamInviteFromText(text: string) {
  const match = text.match(JAM_INVITE_PATTERN);
  if (!match) return false;

  localStorage.setItem("spotify_jam_invite_url", match[0]);
  window.dispatchEvent(new Event("spotify-jam-updated"));
  return true;
}

function saveSharedJamInvite() {
  const params = new URLSearchParams(window.location.search);
  const sharedText = [params.get("url"), params.get("text"), params.get("title")]
    .filter(Boolean)
    .map((value) => value || "")
    .join(" ");
  if (!saveJamInviteFromText(sharedText)) return;

  window.history.replaceState({}, "", `${import.meta.env.BASE_URL}`);
}

async function tryReadJamInviteFromClipboard() {
  try {
    const text = await navigator.clipboard?.readText?.();
    if (text) saveJamInviteFromText(text);
  } catch {
    // Clipboard reads need browser permission/user activation; Android share target remains the fallback.
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Vehicle} />
      <Route path="/vehicle" component={Vehicle} />
      <Route path="/service" component={Service} />
      <Route path="/repairs" component={Repairs} />
      <Route path="/camping" component={Camping} />
      <Route path="/lighting" component={Lighting} />
      <Route path="/diagnostics" component={Diagnostics} />
      <Route path="/reminders" component={Reminders} />
      <Route path="/settings" component={Settings} />
      <Route path="/spotify" component={Spotify} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    saveSharedJamInvite();
    void tryReadJamInviteFromClipboard();

    const checkJamClipboard = () => {
      if (document.visibilityState === "visible") {
        void tryReadJamInviteFromClipboard();
      }
    };

    window.addEventListener("focus", checkJamClipboard);
    document.addEventListener("visibilitychange", checkJamClipboard);

    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: "landscape-primary") => Promise<void>;
    };

    orientation.lock?.("landscape-primary").catch(() => {
      // Android may reject this outside a fully installed PWA; CSS still keeps the dashboard landscape.
    });

    return () => {
      window.removeEventListener("focus", checkJamClipboard);
      document.removeEventListener("visibilitychange", checkJamClipboard);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AlertSystem />
          <div className="landscape-app-shell min-h-[100dvh] bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
            <Router />
            <SpotifyBubble />
            <BottomNav />
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
