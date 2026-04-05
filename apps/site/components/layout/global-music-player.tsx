"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Minimize2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const AUDIO_API_BASE = "https://audio.hexi.men";
const PLAYLIST_URL = `${AUDIO_API_BASE}/playlist.json`;
const SIGNED_URL_REFRESH_BUFFER_MS = 15_000;

type PlaylistItem = {
  key: string;
  title: string;
  artist?: string;
  duration?: number;
  mimeType?: string;
};

type PlaylistResponse = {
  title?: string;
  items?: PlaylistItem[];
};

type SignedTrackResponse = {
  key: string;
  url: string;
  expiresAt?: string;
};

type CachedTrackUrl = {
  url: string;
  expiresAt?: number;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function GlobalMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const signedUrlCacheRef = useRef(new Map<string, CachedTrackUrl>());
  const retryKeyRef = useRef<string | null>(null);
  const playIntentRef = useRef(false);
  const resumeAfterGestureRef = useRef(false);

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentTrack = playlist[currentIndex];

  const totalTracks = playlist.length;

  const displayedDuration = useMemo(() => {
    if (duration > 0) {
      return duration;
    }
    return currentTrack?.duration ?? 0;
  }, [currentTrack?.duration, duration]);

  const fetchSignedTrackUrl = useCallback(
    async (track: PlaylistItem, forceRefresh = false) => {
      const cached = signedUrlCacheRef.current.get(track.key);
      const now = Date.now();

      if (
        !forceRefresh &&
        cached?.url &&
        (!cached.expiresAt || cached.expiresAt - SIGNED_URL_REFRESH_BUFFER_MS > now)
      ) {
        return cached.url;
      }

      const response = await fetch(
        `${AUDIO_API_BASE}/track-url/${encodeURIComponent(track.key)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`Track request failed with ${response.status}`);
      }

      const data = (await response.json()) as SignedTrackResponse;
      const expiresAt = data.expiresAt ? Date.parse(data.expiresAt) : undefined;

      signedUrlCacheRef.current.set(track.key, {
        url: data.url,
        expiresAt: Number.isNaN(expiresAt) ? undefined : expiresAt,
      });

      return data.url;
    },
    []
  );

  const playTrack = useCallback(
    async (targetIndex: number, options?: { forceRefresh?: boolean; playAfter?: boolean }) => {
      if (!playlist.length) {
        return;
      }

      const playAfter = options?.playAfter !== false;
      const normalizedIndex = (targetIndex + playlist.length) % playlist.length;
      const track = playlist[normalizedIndex];
      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      setLoadError(null);
      setIsTrackLoading(true);
      playIntentRef.current = playAfter;

      try {
        const signedUrl = await fetchSignedTrackUrl(track, options?.forceRefresh);
        retryKeyRef.current = null;
        setCurrentIndex(normalizedIndex);
        setDuration(track.duration ?? 0);

        if (audio.src !== signedUrl) {
          audio.src = signedUrl;
        }

        audio.load();
        if (playAfter) {
          resumeAfterGestureRef.current = false;
          await audio.play();
        }
      } catch (error) {
        playIntentRef.current = false;
        setIsPlaying(false);
        if (!playAfter) {
          resumeAfterGestureRef.current = false;
        }
        const autoplayBlocked =
          error instanceof DOMException && error.name === "NotAllowedError";
        if (!autoplayBlocked) {
          setLoadError("Unable to reach the audio service");
        }
        if (!autoplayBlocked) {
          console.error(error);
        }
      } finally {
        setIsTrackLoading(false);
      }
    },
    [fetchSignedTrackUrl, playlist]
  );

  const pauseTrack = useCallback(() => {
    playIntentRef.current = false;
    audioRef.current?.pause();
  }, []);

  const togglePlayback = useCallback(async () => {
    if (!playlist.length) {
      return;
    }

    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (!audio.src) {
      await playTrack(currentIndex);
      return;
    }

    if (audio.paused) {
      playIntentRef.current = true;
      resumeAfterGestureRef.current = false;

      try {
        await audio.play();
      } catch {
        await playTrack(currentIndex, { forceRefresh: true });
      }
      return;
    }

    pauseTrack();
  }, [currentIndex, pauseTrack, playTrack, playlist.length]);

  const goToRelativeTrack = useCallback(
    async (direction: 1 | -1) => {
      if (!playlist.length) {
        return;
      }

      await playTrack(currentIndex + direction);
    },
    [currentIndex, playTrack, playlist.length]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPlaylist() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(PLAYLIST_URL, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Playlist request failed with ${response.status}`);
        }

        const data = (await response.json()) as PlaylistResponse;
        const items = Array.isArray(data.items) ? data.items : [];

        if (!isMounted) {
          return;
        }

        setPlaylist(items);
        setCurrentIndex(0);
        setDuration(items[0]?.duration ?? 0);

        if (!items.length) {
          setLoadError("Playlist is empty");
        }
      } catch (error) {
        if (isMounted) {
          setLoadError("Failed to load playlist");
        }
        console.error(error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPlaylist();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || playlist.length === 0) {
      return;
    }

    resumeAfterGestureRef.current = true;
    void playTrack(0, { playAfter: false });

    const tryPlayFromGesture = () => {
      if (!resumeAfterGestureRef.current) {
        return;
      }

      const audio = audioRef.current;

      if (!audio?.src) {
        return;
      }

      if (!audio.paused) {
        resumeAfterGestureRef.current = false;
        return;
      }

      resumeAfterGestureRef.current = false;
      playIntentRef.current = true;

      void audio.play().catch((error) => {
        playIntentRef.current = false;
        setIsPlaying(false);
        const suppressed =
          error instanceof DOMException && error.name === "NotAllowedError";
        if (!suppressed) {
          setLoadError("Unable to reach the audio service");
          console.error(error);
        }
      });
    };

    window.addEventListener("pointerdown", tryPlayFromGesture, true);
    window.addEventListener("keydown", tryPlayFromGesture, true);

    return () => {
      resumeAfterGestureRef.current = false;
      window.removeEventListener("pointerdown", tryPlayFromGesture, true);
      window.removeEventListener("keydown", tryPlayFromGesture, true);
    };
  }, [isLoading, playlist.length, playTrack]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      void playTrack(currentIndex + 1);
    };

    const handleError = async () => {
      const track = playlist[currentIndex];

      if (!track || !playIntentRef.current || retryKeyRef.current === track.key) {
        setIsTrackLoading(false);
        setIsPlaying(false);
        return;
      }

      retryKeyRef.current = track.key;
      await playTrack(currentIndex, { forceRefresh: true });
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [currentIndex, playTrack, playlist]);

  const progressMax = displayedDuration > 0 ? displayedDuration : 0;

  return (
    <>
      <audio ref={audioRef} preload="none" />

      <div
        className={cn(
          "fixed right-4 bottom-4 z-[60] overflow-hidden border border-black/10 bg-white/92 text-neutral-900 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-sm transition-all duration-300 ease-out",
          "supports-backdrop-filter:bg-white/75",
          isExpanded
            ? "h-[212px] w-[min(calc(100vw-2rem),18rem)] rounded-[1.6rem]"
            : "h-16 w-16 rounded-[1.4rem]"
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(244,244,245,0.88))]" />
        {/* <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#111827,#52525b,#d4d4d8)]" /> */}

        {isExpanded ? (
          <div className="relative flex h-full flex-col p-3">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-geist-mono uppercase tracking-[0.28em] text-neutral-500">
                  Playlist Loop
                </p>
                <p className="truncate pt-1 text-sm font-semibold text-neutral-900">
                  {currentTrack?.title ?? (isLoading ? "Loading..." : "No tracks")}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {currentTrack?.artist ?? (loadError ?? `${totalTracks} tracks`)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/80 text-neutral-700 transition hover:bg-neutral-100"
                aria-label="Minimize player"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void goToRelativeTrack(-1)}
                disabled={!playlist.length || isLoading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/85 text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous track"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => void togglePlayback()}
                disabled={!playlist.length || isLoading}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-950 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
              </button>

              <button
                type="button"
                onClick={() => void goToRelativeTrack(1)}
                disabled={!playlist.length || isLoading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/85 text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next track"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-auto">
              <input
                type="range"
                min={0}
                max={progressMax || 0}
                step={1}
                value={Math.min(currentTime, progressMax || 0)}
                onChange={(event) => {
                  const nextTime = Number(event.target.value);
                  setCurrentTime(nextTime);

                  if (audioRef.current) {
                    audioRef.current.currentTime = nextTime;
                  }
                }}
                disabled={!playlist.length || progressMax <= 0}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Playback progress"
              />

              <div className="mt-2 flex items-center justify-between text-[11px] font-geist-mono tracking-[0.14em] text-neutral-500 uppercase">
                <span>{formatTime(currentTime)}</span>
                <span>{isTrackLoading ? "Buffering" : formatTime(displayedDuration)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="group cursor-pointer relative flex h-full w-full items-center justify-center"
            role="button"
            tabIndex={0}
            onClick={() => setIsExpanded(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsExpanded(true);
              }
            }}
            aria-label="Expand music player"
            title="Expand music player"
          >
            <button
              title={isPlaying ? "Pause" : "Play"}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void togglePlayback();
              }}
              disabled={!playlist.length || isLoading}
              className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-[1rem] bg-neutral-950 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4.5 w-4.5 fill-current" /> : <Play className="h-4.5 w-4.5 fill-current" />}
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2.5 scale-y-50">
              <ChevronDown className="size-8 transition-colors text-transparent group-hover:text-black/75" strokeWidth={3} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
