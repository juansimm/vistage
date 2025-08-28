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
    <>
      <div className="h-full overflow-hidden">
        {/* height 4rem */}
        <div className="bg-gradient-to-b from-black/50 to-black/10 backdrop-blur-[2px] h-[4rem] flex items-center">
          <header className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-center pt-4 md:pt-0 gap-2">
            <div>
              <a className="flex items-center" href="/">
                <h1 className="text-2xl font-bold text-white">
                  Vistage AI
                </h1>
              </a>
            </div>
          </header>
        </div>

        {/* height 100% minus 4rem */}
        <main className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 h-[calc(100%-4rem)]">
          <VistageAIDashboard />
        </main>
      </div>
    </>
  );
}
