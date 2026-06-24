import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Loader2, Music2, Pause, Play, QrCode, RefreshCw, Share2, SkipBack, SkipForward, Users } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const SPOTIFY_CLIENT_ID = "7e3432b5296a44a69af55235da632940";
const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");
const APP_BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
const REDIRECT_URI = `${window.location.origin}${APP_BASE_PATH}/`;

interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  id: string;
  external_urls?: { spotify?: string };
  uri?: string;
}

interface PlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
  device: { name: string } | null;
}

function generateCodeVerifier(length = 128) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

async function generateCodeChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function msToTime(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SpotifyBubble() {
  const [, setLocation] = useLocation();
  const [expanded, setExpanded] = useState(() => localStorage.getItem("spotify_bubble_expanded") === "true");
  const [position, setPosition] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("spotify_bubble_position") || "") as { x: number; y: number };
    } catch {
      return { x: window.innerWidth - 96, y: window.innerHeight - 196 };
    }
  });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ pointerId: 0, startX: 0, startY: 0, originX: 0, originY: 0, moved: false });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("spotify_access_token") || "");
  const [tokenExpiry, setTokenExpiry] = useState(() => Number(localStorage.getItem("spotify_token_expiry") || 0));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("spotify_refresh_token") || "");
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showJamQr, setShowJamQr] = useState(false);
  const [jamInviteUrl, setJamInviteUrl] = useState(() => localStorage.getItem("spotify_jam_invite_url") || "");

  const isTokenValid = Boolean(accessToken && Date.now() < tokenExpiry - 30000);
  const hasRefreshToken = Boolean(refreshToken || localStorage.getItem("spotify_refresh_token"));
  const track = playback?.item;
  const duration = track?.duration_ms || 1;
  const albumArt = track?.album.images[0]?.url;
  const artistText = track?.artists.map((artist) => artist.name).join(", ") || "";
  const progressPct = Math.min((progress / duration) * 100, 100);
  const jamActive = /^https:\/\/open\.spotify\.com\/socialsession\/[^/?#]+/i.test(jamInviteUrl);
  const jamQrUrl = jamActive
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(jamInviteUrl)}`
    : "";

  const clampPosition = useCallback((next: { x: number; y: number }) => {
    const width = expanded ? 320 : 64;
    const height = expanded ? 232 : 64;
    const margin = 12;
    return {
      x: window.innerWidth - width - margin,
      y: Math.min(Math.max(next.y, margin), window.innerHeight - height - 104),
    };
  }, [expanded]);

  useEffect(() => {
    localStorage.setItem("spotify_bubble_expanded", String(expanded));
    setPosition((current) => clampPosition(current));
  }, [expanded, clampPosition]);

  useEffect(() => {
    localStorage.setItem("spotify_bubble_position", JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    const syncJam = () => setJamInviteUrl(localStorage.getItem("spotify_jam_invite_url") || "");
    window.addEventListener("storage", syncJam);
    window.addEventListener("spotify-jam-updated", syncJam);
    return () => {
      window.removeEventListener("storage", syncJam);
      window.removeEventListener("spotify-jam-updated", syncJam);
    };
  }, []);

  const doRefreshToken = useCallback(async () => {
    const storedRefresh = localStorage.getItem("spotify_refresh_token");
    const storedClientId = localStorage.getItem("spotify_client_id") || SPOTIFY_CLIENT_ID;
    if (!storedRefresh || !storedClientId) return false;

    const resp = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: storedRefresh,
        client_id: storedClientId,
      }),
    });

    if (!resp.ok) {
      ["spotify_access_token", "spotify_token_expiry", "spotify_refresh_token"].forEach((key) => localStorage.removeItem(key));
      setAccessToken("");
      setTokenExpiry(0);
      setRefreshToken("");
      setError("Spotify link expired");
      return false;
    }

    const data = await resp.json();
    const expiry = Date.now() + data.expires_in * 1000;
    localStorage.setItem("spotify_access_token", data.access_token);
    localStorage.setItem("spotify_token_expiry", String(expiry));
    if (data.refresh_token) {
      localStorage.setItem("spotify_refresh_token", data.refresh_token);
      setRefreshToken(data.refresh_token);
    }
    setAccessToken(data.access_token);
    setTokenExpiry(expiry);
    setError("");
    return true;
  }, []);

  const spotifyFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response | null> => {
    let token = localStorage.getItem("spotify_access_token");
    if (!token || Date.now() >= Number(localStorage.getItem("spotify_token_expiry") || 0) - 30000) {
      const refreshed = await doRefreshToken();
      if (!refreshed) return null;
      token = localStorage.getItem("spotify_access_token");
    }

    const resp = await fetch(`https://api.spotify.com/v1${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (resp.status === 401) {
      const refreshed = await doRefreshToken();
      return refreshed ? spotifyFetch(url, options) : null;
    }
    return resp;
  }, [doRefreshToken]);

  const fetchPlayback = useCallback(async () => {
    if (!isTokenValid && !hasRefreshToken) return;
    setLoading(true);
    try {
      const resp = await spotifyFetch("/me/player");
      if (!resp) return;
      if (resp.status === 204) {
        setPlayback(null);
        setError("");
        return;
      }
      if (resp.ok) {
        const data = await resp.json() as PlaybackState;
        setPlayback(data);
        setProgress(data.progress_ms);
        setError("");
      }
    } catch {
      setError("Spotify offline");
    } finally {
      setLoading(false);
    }
  }, [hasRefreshToken, isTokenValid, spotifyFetch]);

  useEffect(() => {
    if (isTokenValid || !hasRefreshToken) return;
    doRefreshToken().then((ok) => {
      if (ok) fetchPlayback();
    });
  }, [doRefreshToken, fetchPlayback, hasRefreshToken, isTokenValid]);

  useEffect(() => {
    fetchPlayback();
    const interval = setInterval(fetchPlayback, 5000);
    return () => clearInterval(interval);
  }, [fetchPlayback]);

  useEffect(() => {
    if (!playback?.is_playing) return;
    const interval = setInterval(() => {
      setProgress((current) => Math.min(current + 1000, duration));
    }, 1000);
    return () => clearInterval(interval);
  }, [duration, playback?.is_playing]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const storedVerifier = sessionStorage.getItem("spotify_verifier");
    const storedClientId = localStorage.getItem("spotify_client_id") || SPOTIFY_CLIENT_ID;
    if (!code || !storedVerifier || !storedClientId) return;

    window.history.replaceState({}, "", window.location.pathname);
    setLoading(true);
    fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: storedClientId,
        code_verifier: storedVerifier,
      }),
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (!data.access_token) {
          setError(data.error_description || "Spotify auth failed");
          return;
        }
        const expiry = Date.now() + data.expires_in * 1000;
        localStorage.setItem("spotify_access_token", data.access_token);
        localStorage.setItem("spotify_token_expiry", String(expiry));
        localStorage.setItem("spotify_refresh_token", data.refresh_token || "");
        setAccessToken(data.access_token);
        setTokenExpiry(expiry);
        setRefreshToken(data.refresh_token || "");
        sessionStorage.removeItem("spotify_verifier");
        setExpanded(true);
        setLocation("/");
      })
      .finally(() => setLoading(false));
  }, []);

  const connectSpotify = async () => {
    localStorage.setItem("spotify_client_id", SPOTIFY_CLIENT_ID);
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem("spotify_verifier", verifier);

    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("scope", SPOTIFY_SCOPES);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", challenge);
    window.location.href = url.toString();
  };

  const playerAction = async (endpoint: string, method = "POST") => {
    setLoading(true);
    await spotifyFetch(endpoint, { method });
    setTimeout(fetchPlayback, 300);
    setLoading(false);
  };

  const seekTo = async (value: number) => {
    setProgress(value);
    await spotifyFetch(`/me/player/seek?position_ms=${Math.floor(value)}`, { method: "PUT" });
    setTimeout(fetchPlayback, 250);
  };

  const saveJamInvite = (url: string) => {
    const trimmed = url.trim();
    if (!/^https:\/\/open\.spotify\.com\/socialsession\/[^/?#]+/i.test(trimmed)) {
      setError("Paste a Spotify Jam invite link");
      return;
    }
    localStorage.setItem("spotify_jam_invite_url", trimmed);
    setJamInviteUrl(trimmed);
    setShowJamQr(true);
    setError("");
    window.dispatchEvent(new Event("spotify-jam-updated"));
  };

  const startJam = () => {
    window.location.href = "spotify:";
    const pasted = window.prompt("Start a Jam in Spotify, tap Share Invite, then paste the Jam link here:");
    if (pasted) saveJamInvite(pasted);
  };

  const shareJam = async () => {
    if (!jamActive) return;
    if (navigator.share) {
      await navigator.share({ title: "Join my Spotify Jam", url: jamInviteUrl });
      return;
    }
    await navigator.clipboard.writeText(jamInviteUrl);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || dragRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true;
    setPosition(clampPosition({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy }));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (!dragRef.current.moved) setExpanded((current) => !current);
  };

  const shellStyle = useMemo(() => ({
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
  }), [position.x, position.y]);

  return (
    <div
      data-testid="spotify-floating-player"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={cn(
        "fixed left-0 top-0 z-[60] select-none touch-none border border-[#1DB954]/45 bg-zinc-950/95 text-white shadow-2xl shadow-black/50 backdrop-blur-xl transition-[width,height,border-radius] duration-200",
        expanded ? "h-[232px] w-[320px] rounded-2xl p-3" : "h-16 w-16 rounded-full",
        dragging && "transition-none"
      )}
      style={shellStyle}
    >
      {!expanded ? (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#1DB954] text-black">
          {albumArt ? <img src={albumArt} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} /> : null}
          <div className="absolute inset-0 bg-[#1DB954]/70" />
          {loading ? <Loader2 className="relative h-8 w-8 animate-spin" /> : <Music2 className="relative h-8 w-8" />}
        </div>
      ) : (
        <div className="flex h-full flex-col gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#1DB954]/20">
              {albumArt ? (
                <img src={albumArt} alt="" className="h-full w-full object-cover" draggable={false} />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music2 className="h-7 w-7 text-[#1DB954]" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{track?.name || (hasRefreshToken ? "Nothing playing" : "Spotify not linked")}</p>
              <p className="truncate text-xs text-zinc-400">{artistText || error || playback?.device?.name || "Tap connect once, then it stays here"}</p>
            </div>
            <button
              type="button"
              onClick={fetchPlayback}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-zinc-300 hover:bg-white/10"
              aria-label="Refresh Spotify"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </div>

          {hasRefreshToken || isTokenValid ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-9 text-[10px] tabular-nums text-zinc-500">{msToTime(progress)}</span>
                <input
                  aria-label="Seek Spotify track"
                  className="h-2 min-w-0 flex-1 accent-[#1DB954]"
                  type="range"
                  min={0}
                  max={duration}
                  step={1000}
                  value={Math.min(progress, duration)}
                  onChange={(event) => setProgress(Number(event.target.value))}
                  onPointerUp={(event) => seekTo(Number((event.target as HTMLInputElement).value))}
                  onKeyUp={(event) => seekTo(Number((event.target as HTMLInputElement).value))}
                />
                <span className="w-9 text-right text-[10px] tabular-nums text-zinc-500">{msToTime(duration)}</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => playerAction("/me/player/previous")}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/5 hover:bg-white/10"
                  aria-label="Previous track"
                >
                  <SkipBack className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => playback && playerAction(playback.is_playing ? "/me/player/pause" : "/me/player/play")}
                  className="grid h-12 w-12 place-items-center rounded-full bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/25"
                  aria-label={playback?.is_playing ? "Pause Spotify" : "Play Spotify"}
                >
                  {playback?.is_playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
                </button>
                <button
                  type="button"
                  onClick={() => playerAction("/me/player/next")}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/5 hover:bg-white/10"
                  aria-label="Next track"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={jamActive ? () => { window.location.href = jamInviteUrl; } : startJam}
                    className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1DB954]/15 text-xs font-bold text-[#1DB954] hover:bg-[#1DB954]/25"
                    aria-label={jamActive ? "Join Spotify Jam" : "Start Spotify Jam"}
                  >
                    <Users className="h-4 w-4" /> {jamActive ? "Join Jam" : "Start Jam"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJamQr((current) => !current)}
                    disabled={!jamActive}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-zinc-300 hover:bg-white/10"
                    aria-label="Show Spotify Jam QR code"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(jamInviteUrl)}
                    disabled={!jamActive}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-zinc-300 hover:bg-white/10 disabled:opacity-40"
                    aria-label="Copy Spotify Jam link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={shareJam}
                    disabled={!jamActive}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-zinc-300 hover:bg-white/10 disabled:opacity-40"
                    aria-label="Share Spotify Jam"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
                {showJamQr ? (
                  <div className="mt-2 flex items-center gap-3">
                    {jamActive ? (
                      <img src={jamQrUrl} alt="Spotify Jam QR code" className="h-16 w-16 rounded-lg bg-white p-1" draggable={false} />
                    ) : (
                      <div className="grid h-16 w-16 place-items-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold text-zinc-500">No Jam</div>
                    )}
                    <p className="text-[10px] leading-snug text-zinc-400">
                      {jamActive ? "QR opens the active Spotify Jam." : "No Active Jam. Start one in Spotify and paste the invite."}
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={connectSpotify}
              className="mt-auto h-11 rounded-xl bg-[#1DB954] px-4 text-sm font-bold text-black"
            >
              Connect Spotify
            </button>
          )}
        </div>
      )}
    </div>
  );
}
