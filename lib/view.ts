import type { Source } from "./types";
import type { IconName } from "@/components/icon";
export type Page =
  | "chat"
  | "playground"
  | "apps"
  | "data"
  | "settings"
  | "users";
export const nav: { id: Page; label: string; icon: IconName }[] = [
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "playground", label: "Playground", icon: "tree" },
  { id: "apps", label: "Apps", icon: "apps" },
  { id: "data", label: "Data", icon: "data" },
  { id: "users", label: "Users", icon: "users" },
  { id: "settings", label: "Settings", icon: "settings" },
];
export const sourceIcon: Record<Source, IconName> = {
  note: "brain",
  gmail: "gmail",
  pumble: "chat",
  file: "file",
};
export const sourceName: Record<Source, string> = {
  note: "Note",
  gmail: "Gmail",
  pumble: "Pumble",
  file: "File",
};
export const shortDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
