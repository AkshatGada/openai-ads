import { useEffect, useState } from "react";
import type { IndustryData } from "../lib/types";
import { INDUSTRIES, type IndustryId } from "../lib/registry";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: IndustryData }
  | { status: "error"; message: string };

export function useIndustryData(id: IndustryId | null): State {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!id) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    INDUSTRIES[id]
      .load()
      .then((data) => {
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
