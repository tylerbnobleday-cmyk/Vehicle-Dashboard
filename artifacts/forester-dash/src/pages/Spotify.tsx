import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Music, Shuffle, Repeat, ExternalLink, LogOut, RefreshCw, Loader2
} from "lucide-react";

const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");

const SPOTIFY_CLIENT_ID = "7e3432b5296a44a69af55235da632940";
const APP_BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
const REDIRECT_URI = `${window.location.origin}${APP_BASE_PATH}/`;

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
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  id: string;
}

interface PlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
  shuffle_state: boolean;
  repeat_state: "off" | "context" | "track";
  device: { volume_percent: number; name: string } | null;
}

function msToTime(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Spotify() {
  const [clientId, setClientId] = useState(() => localStorage.getItem("spotify_client_id") || SPOTIFY_CLIENT_ID);
  const [clientIdInput, setClientIdInput] = useState(() => localStorage.getItem("spotify_client_id") || SPOTIFY_CLIENT_ID);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("spotify_access_token") || "");
  const [tokenExpiry, setTokenExpiry] = useState(() => Number(localStorage.getItem("spotify_token_expiry") || 0));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("spotify_refresh_token") || "");
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoringSession, setRestoringSession] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(50);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTokenValid = Boolean(accessToken && Date.now() < tokenExpiry - 30000);
  const hasRefreshToken = Boolean(refreshToken || localStorage.getItem("spotify_refresh_token"));

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
    if (resp.ok) {
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
    }
    ["spotify_access_token", "spotify_token_expiry", "spotify_refresh_token"].forEach(k => localStorage.removeItem(k));
    setAccessToken("");
    setTokenExpiry(0);
    setRefreshToken("");
    setError("Spotify link expired. Connect once again to relink this device.");
    return false;
  }, []);

  const spotifyFetch = useCallback(async (url: string, options: RequestInit = {}) => {
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
    if (!isTokenValid) return;
    try {
      const resp = await spotifyFetch("/me/player");
      if (!resp) return;
      if (resp.status === 204) { setPlayback(null); return; }
      if (resp.ok) {
        const data: PlaybackState = await resp.json();
        setPlayback(data);
        setProgress(data.progress_ms);
        setVolume(data.device?.volume_percent ?? 50);
        setError("");
      }
    } catch {
      setError("Failed to fetch playback state");
    }
  }, [isTokenValid, spotifyFetch]);

  useEffect(() => {
    if (!isTokenValid) return;
    fetchPlayback();
    const interval = setInterval(fetchPlayback, 5000);
    return () => clearInterval(interval);
  }, [isTokenValid, fetchPlayback]);

  useEffect(() => {
    if (isTokenValid || !hasRefreshToken || restoringSession) return;
    setRestoringSession(true);
    doRefreshToken().finally(() => setRestoringSession(false));
  }, [isTokenValid, hasRefreshToken, restoringSession, doRefreshToken]);

  useEffect(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (playback?.is_playing) {
      progressRef.current = setInterval(() => {
        setProgress((p) => p + 1000);
      }, 1000);
    }
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [playback?.is_playing, playback?.item?.id]);

  const handleConnect = async () => {
    if (!clientIdInput.trim()) { setError("Enter your Spotify Client ID first."); return; }
    const cid = clientIdInput.trim();
    localStorage.setItem("spotify_client_id", cid);
    setClientId(cid);
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem("spotify_verifier", verifier);
    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.set("client_id", cid);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("scope", SPOTIFY_SCOPES);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", challenge);
    window.location.href = url.toString();
  };

  const handleDisconnect = () => {
    ["spotify_access_token", "spotify_token_expiry", "spotify_refresh_token"].forEach(k => localStorage.removeItem(k));
    setAccessToken(""); setTokenExpiry(0); setRefreshToken(""); setPlayback(null); setError("");
  };

  const playerAction = async (endpoint: string, method = "POST", body?: object) => {
    setLoading(true);
    await spotifyFetch(endpoint, { method, body: body ? JSON.stringify(body) : undefined });
    setTimeout(fetchPlayback, 300);
    setLoading(false);
  };

  const handlePlayPause = () => {
    if (!playback) return;
    playerAction(playback.is_playing ? "/me/player/pause" : "/me/player/play");
  };

  const handleVolume = async (val: number[]) => {
    setVolume(val[0]);
    await spotifyFetch(`/me/player/volume?volume_percent=${val[0]}`, { method: "PUT" });
  };

  const track = playback?.item;
  const duration = track?.duration_ms || 1;
  const progressPct = Math.min((progress / duration) * 100, 100);
  const albumArt = track?.album.images[0]?.url;

  if (!isTokenValid) {
    return (
      <div className="min-h-[calc(100dvh-6rem)] flex flex-col items-center justify-center p-6 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center mx-auto mb-4">
              <Music className="w-10 h-10 text-[#1DB954]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Spotify Control</h1>
            <p className="text-muted-foreground text-lg">Control Spotify from the back seat</p>
          </div>

          <Card className="border-border/50 bg-card/60 backdrop-blur">
            <CardContent className="p-6 space-y-5">
              {loading || restoringSession ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <Loader2 className="w-10 h-10 animate-spin text-[#1DB954]" />
                  <p className="text-muted-foreground">{restoringSession ? "Restoring Spotify link..." : "Connecting to Spotify..."}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Spotify Client ID</Label>
                    <Input
                      data-testid="input-spotify-client-id"
                      value={clientIdInput}
                      onChange={e => setClientIdInput(e.target.value)}
                      placeholder="Paste your Spotify Client ID here"
                      className="h-14 text-base font-mono"
                    />
                  </div>

                  {error && (
                    <p className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3">{error}</p>
                  )}

                  <Button
                    data-testid="button-spotify-connect"
                    onClick={handleConnect}
                    className="w-full h-14 text-lg font-bold bg-[#1DB954] hover:bg-[#1DB954]/90 text-black"
                  >
                    Connect Spotify Account
                  </Button>

                  <div className="border border-border/40 rounded-xl p-4 space-y-3 bg-muted/20">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Setup once, then it stays linked</p>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                      <li>Go to <span className="text-primary font-mono text-xs">developer.spotify.com/dashboard</span></li>
                      <li>Create an app (name anything)</li>
                      <li>In app settings, add this Redirect URI:</li>
                    </ol>
                    <div className="bg-background rounded-lg p-3 border border-border/50 flex items-center gap-2">
                      <code className="text-xs text-primary break-all flex-1">{REDIRECT_URI}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(REDIRECT_URI)}
                        className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside" start={4}>
                      <li>Copy the Client ID and paste it above</li>
                      <li>Spotify must be playing on another device (phone/laptop)</li>
                    </ol>
                    <a
                      href="https://developer.spotify.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      Open Spotify Developer Dashboard <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-6rem)] flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Spotify</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={fetchPlayback} data-testid="button-spotify-refresh">
            <RefreshCw className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDisconnect} data-testid="button-spotify-disconnect">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!playback || !track ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
          >
            <div className="w-32 h-32 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-center">
              <Music className="w-16 h-16 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-muted-foreground">Nothing playing</p>
              <p className="text-muted-foreground/60 mt-1">Start Spotify on your phone or laptop, then refresh</p>
            </div>
            <Button onClick={fetchPlayback} variant="outline" className="h-12 px-6 text-base gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col gap-5"
          >
            <Card className="border-border/40 bg-card/50 backdrop-blur overflow-hidden flex-1">
              <CardContent className="p-6 flex flex-col items-center gap-6 h-full">
                <motion.div
                  className="relative w-full max-w-xs aspect-square"
                  animate={{ scale: playback.is_playing ? 1 : 0.92 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  {albumArt ? (
                    <img
                      src={albumArt}
                      alt={track.album.name}
                      className="w-full h-full object-cover rounded-2xl shadow-2xl shadow-black/60"
                    />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-muted flex items-center justify-center">
                      <Music className="w-24 h-24 text-muted-foreground/30" />
                    </div>
                  )}
                  {playback.is_playing && (
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-[#1DB954]/40 animate-pulse" />
                  )}
                </motion.div>

                <div className="text-center space-y-1 w-full">
                  <p className="text-2xl md:text-3xl font-bold leading-tight truncate" data-testid="text-track-name">{track.name}</p>
                  <p className="text-lg text-muted-foreground truncate">{track.artists.map(a => a.name).join(", ")}</p>
                  <p className="text-sm text-muted-foreground/60 truncate">{track.album.name}</p>
                  {playback.device && (
                    <p className="text-xs text-muted-foreground/40 mt-1">Playing on: {playback.device.name}</p>
                  )}
                </div>

                <div className="w-full space-y-1">
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden cursor-pointer"
                    onClick={async (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - rect.left) / rect.width;
                      const pos = Math.floor(pct * duration);
                      setProgress(pos);
                      await spotifyFetch(`/me/player/seek?position_ms=${pos}`, { method: "PUT" });
                    }}
                  >
                    <motion.div
                      className="h-full bg-[#1DB954] rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>{msToTime(progress)}</span>
                    <span>{msToTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 w-full">
                  <Button
                    variant="ghost" size="icon"
                    className={`w-12 h-12 ${playback.shuffle_state ? "text-[#1DB954]" : "text-muted-foreground"}`}
                    onClick={() => playerAction(`/me/player/shuffle?state=${!playback.shuffle_state}`, "PUT")}
                    data-testid="button-spotify-shuffle"
                  >
                    <Shuffle className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="ghost" size="icon" className="w-16 h-16 text-foreground"
                    onClick={() => playerAction("/me/player/previous")}
                    data-testid="button-spotify-prev"
                  >
                    <SkipBack className="w-8 h-8 fill-current" />
                  </Button>

                  <Button
                    size="icon"
                    className="w-20 h-20 rounded-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-black shadow-lg shadow-[#1DB954]/30"
                    onClick={handlePlayPause}
                    disabled={loading}
                    data-testid="button-spotify-playpause"
                  >
                    {loading ? (
                      <Loader2 className="w-9 h-9 animate-spin" />
                    ) : playback.is_playing ? (
                      <Pause className="w-9 h-9 fill-current" />
                    ) : (
                      <Play className="w-9 h-9 fill-current ml-1" />
                    )}
                  </Button>

                  <Button
                    variant="ghost" size="icon" className="w-16 h-16 text-foreground"
                    onClick={() => playerAction("/me/player/next")}
                    data-testid="button-spotify-next"
                  >
                    <SkipForward className="w-8 h-8 fill-current" />
                  </Button>

                  <Button
                    variant="ghost" size="icon"
                    className={`w-12 h-12 ${playback.repeat_state !== "off" ? "text-[#1DB954]" : "text-muted-foreground"}`}
                    onClick={() => {
                      const next = playback.repeat_state === "off" ? "context" : playback.repeat_state === "context" ? "track" : "off";
                      playerAction(`/me/player/repeat?state=${next}`, "PUT");
                    }}
                    data-testid="button-spotify-repeat"
                  >
                    <Repeat className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 w-full max-w-xs">
                  <VolumeX className="w-5 h-5 text-muted-foreground shrink-0" />
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolume}
                    max={100} step={1}
                    className="flex-1"
                    data-testid="slider-spotify-volume"
                  />
                  <Volume2 className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
