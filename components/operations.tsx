"use client";

import { useEffect, useState } from "react";
import { PlaygroundTree } from "./playground-tree";

const THEME_STORAGE_KEY = "operations-theme";

export default function Operations() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    setDark(savedTheme === "dark");
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
      <main className="absolute inset-0">
        <PlaygroundTree dark={dark} onToggleTheme={() => setDark((value) => !value)} />
      </main>
    </div>
  );
}
