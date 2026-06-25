"use client";

import { useEffect, useState } from "react";
import type { IndustryData } from "@/lib/types";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: IndustryData }
  | { status: "error"; message: string };

export function useIndustryData(id: string | null): State {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!id) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/industries/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: IndustryData) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ status: "error", message: e instanceof Error ? e.message : "Load failed" });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
