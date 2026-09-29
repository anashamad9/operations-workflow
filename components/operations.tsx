"use client";

import { useEffect, useState } from "react";
import { PlaygroundTree } from "./playground-tree";
import { Button } from "./ui/button";
import { Icon } from "./icon";

const THEME_STORAGE_KEY = "operations-theme";

export default function Operations() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(savedTheme ? savedTheme === "dark" : prefersDark);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  }, [dark, ready]);

  return (
    <div className="relative h-svh overflow-hidden bg-background">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 sm:p-5">
          <span className="wordmark pointer-events-auto text-2xl">Operations</span>
          <Button
            size="icon-sm"
            variant="ghost"
            className="pointer-events-auto bg-background/80 shadow-sm backdrop-blur-md"
            onClick={() => setDark((value) => !value)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
          >
            <Icon name={dark ? "sun" : "moon"} size={15} />
          </Button>
      </header>
      <main className="absolute inset-0">
        <PlaygroundTree />
      </main>
    </div>
  );
}
