//src/components/radio/radioplayer/RadioPlayerProvider.tsx

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type RadioStatus = {
  live: boolean;
  title?: string;
  streamUrl?: string | null;
};

type RadioContextType = {
  isLive: boolean;
  isPlaying: boolean;
  title: string;
  streamUrl: string | null;
  playError: string;
  togglePlay: () => Promise<void>;
  stop: () => void;
};

const RadioPlayerContext = createContext<RadioContextType | null>(null);

export function RadioPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [status, setStatus] = useState<RadioStatus>({
    live: false,
    title: "Oração ao vivo",
    streamUrl: null,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/radio/status", { cache: "no-store" });
      if (!r.ok) return;

      const j = (await r.json()) as RadioStatus;

      setStatus((prev) => {
        if (
          prev.live !== j.live ||
          prev.streamUrl !== j.streamUrl ||
          prev.title !== j.title
        ) {
          return j;
        }
        return prev;
      });
    } catch {}
  }, []);

  useEffect(() => {
    loadStatus();
    const t = setInterval(loadStatus, 5000);
    return () => clearInterval(t);
  }, [loadStatus]);

  useEffect(() => {
    if (!status.live || !status.streamUrl) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setPlayError("");
    }
  }, [status.live, status.streamUrl]);

  const togglePlay = useCallback(async () => {
    setPlayError("");

    const a = audioRef.current;
    if (!a || !status.live || !status.streamUrl) return;

    try {
      if (a.paused) {
        await a.play();
        setIsPlaying(true);
      } else {
        a.pause();
        setIsPlaying(false);
      }
    } catch {
      setPlayError("Toque novamente para iniciar o áudio.");
      setIsPlaying(false);
    }
  }, [status.live, status.streamUrl]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    setIsPlaying(false);
  }, []);

  const value = useMemo(
    () => ({
      isLive: !!status.live,
      isPlaying,
      title: status.title ?? "Rádio LHP",
      streamUrl: status.streamUrl ?? null,
      playError,
      togglePlay,
      stop,
    }),
    [status, isPlaying, playError, togglePlay, stop],
  );

  return (
    <RadioPlayerContext.Provider value={value}>
      {children}

      {status.live && status.streamUrl ? (
        <audio
          ref={audioRef}
          src={status.streamUrl}
          preload="none"
          onPlay={() => {
            setPlayError("");
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onError={() => {
            setIsPlaying(false);
            setPlayError("Não foi possível reproduzir o áudio agora.");
          }}
        />
      ) : null}
    </RadioPlayerContext.Provider>
  );
}

export function useRadioPlayer() {
  const ctx = useContext(RadioPlayerContext);
  if (!ctx) {
    throw new Error(
      "useRadioPlayer deve ser usado dentro de RadioPlayerProvider",
    );
  }
  return ctx;
}
