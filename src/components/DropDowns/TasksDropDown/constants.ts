import { Copy, Edit2, Star } from "lucide-react";
import type { MenuItemType } from "./types";

export const MENU_ITEMS: MenuItemType[] = [
  {
    icon: Edit2,
    label: "Bearbeiten",
    kind: "edit",
    shortcut: "",
  },
  {
    icon: Copy,
    label: "Duplizieren",
    kind: "copy",
    shortcut: "",
  },
  {
    icon: Star,
    label: "Favorisieren",
    kind: "favorite",
    shortcut: "",
  },
];

export const LABEL_OPTIONS = ["Dokumentation", "Bug", "Feature"];