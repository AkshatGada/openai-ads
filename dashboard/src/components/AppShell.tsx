"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Header from "@/components/Header";
import GridBackground from "@/components/GridBackground";
import { useAppTheme } from "@/components/ThemeProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();

  const isLanding = pathname === "/";
  const segments = pathname.split("/").filter(Boolean);
  const industryId = segments[0] ?? null;
  const viewId = segments[1] as string | undefined;

  const handleHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const breadcrumb = !isLanding && industryId ? (
    <button
      onClick={() => router.push(`/${industryId}/advertisers`)}
      className="font-sans text-sm text-text-muted transition-colors hover:text-text"
    >
      {viewId ? "Industry" : ""}
    </button>
  ) : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-bg bg-grid text-text">
      <GridBackground />
      <Header
        theme={theme}
        onToggleTheme={toggle}
        onHome={handleHome}
        breadcrumb={breadcrumb}
      />

      {children}

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-border bg-surface/30">
        <div className="mx-auto max-w-[1320px] px-6 py-10 md:px-10">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-accent font-mono text-sm font-bold text-accent-fg">
                  G
                </span>
                <span className="font-display text-sm font-semibold tracking-tight text-text">
                  ChatGPT Ads Library
                </span>
              </div>
              <p className="font-sans text-xs leading-relaxed text-text-faint">
                The first public database of ChatGPT ads. Browse advertisers,
                creatives, and context hints by industry.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Industries
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a href="/enterprise/advertisers" className="font-sans text-xs text-text-faint transition-colors hover:text-text">
                      Enterprise &amp; Fintech
                    </a>
                  </li>
                  <li>
                    <a href="/oms/advertisers" className="font-sans text-xs text-text-faint transition-colors hover:text-text">
                      Fintech &amp; Payments
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Resources
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a href="https://github.com/AkshatGada/openai-ads" target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-text-faint transition-colors hover:text-text">
                      GitHub
                    </a>
                  </li>
                  <li>
                    <span className="font-sans text-xs text-text-faint">API (coming soon)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-text-faint">
              &copy; {new Date().getFullYear()} ChatGPT Ads Library
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
