"use client";

export const runtime = "edge";
import { init } from "@fullstory/browser";
import { useEffect } from "react";
import { VistageAIDashboard } from "./components/VistageAIDashboard";

export default function Home() {
  useEffect(() => {
    init({ orgId: "5HWAN" });
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-stone-900">
      {/* height 4rem */}
      <div className="glass border-b border-stone-700/30 h-[4rem] flex items-center">
        <header className="mx-auto w-full px-4 md:px-6 lg:px-8 flex items-center justify-center pt-4 md:pt-0 gap-2">
          <div>
            <a className="flex items-center" href="/">
              <h1 className="text-2xl font-bold text-yellow-400 drop-shadow-glowYellow tracking-wide">
                Vistage AI
              </h1>
            </a>
          </div>
        </header>
      </div>

      {/* height 100% minus 4rem */}
      <main className="h-[calc(100vh-4rem)] w-full">
        <VistageAIDashboard />
      </main>
    </div>
  );
}
