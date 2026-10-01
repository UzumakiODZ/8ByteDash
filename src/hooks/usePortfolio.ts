import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import type { PortfolioResponse } from "@/lib/portfolio-types";

const REFRESH_MS = 15_000;

interface State {
  data: PortfolioResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  countdown: number;
  paused: boolean;
}

export function usePortfolio() {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    countdown: REFRESH_MS / 1000,
    paused: false,
  });
  const pausedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const loadPortfolio = useCallback(async (keepCurrentData = false) => {
    if (!keepCurrentData) setState((state) => ({ ...state, loading: true, error: null }));
    try {
      const response = await axios.get<PortfolioResponse>("/api/portfolio", { timeout: 20_000 });
      setState((state) => ({
        ...state,
        data: response.data,
        loading: false,
        error: null,
        lastUpdated: response.data.lastUpdated,
        countdown: REFRESH_MS / 1000,
      }));
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error ?? error.message
        : error instanceof Error
          ? error.message
          : "Failed to fetch portfolio";
      setState((state) => ({
        ...state,
        loading: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
    timerRef.current = window.setInterval(() => {
      if (!pausedRef.current) loadPortfolio(true);
    }, REFRESH_MS);
    countdownRef.current = window.setInterval(() => {
      setState((s) => {
        if (s.paused) return s;
        return { ...s, countdown: s.countdown <= 1 ? REFRESH_MS / 1000 : s.countdown - 1 };
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, [loadPortfolio]);

  const togglePaused = useCallback(() => {
    setState((s) => {
      pausedRef.current = !s.paused;
      return { ...s, paused: !s.paused, countdown: REFRESH_MS / 1000 };
    });
  }, []);

  const refresh = useCallback(() => loadPortfolio(true), [loadPortfolio]);

  return { ...state, refresh, togglePaused, refreshMs: REFRESH_MS };
}
