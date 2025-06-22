import { Copy, Edit2, Star } from "lucide-react";
import type { MenuItem } from "./types";

export const MENU_ITEMS: MenuItem[] = [
    {
        icon: Edit2,
        label: "Bearbeiten",
        shortcut: "Strg + E"
    },
    {
        icon: Copy,
        label: "Duplizieren",
        shortcut: "Strg + D"
    },
    {
        icon: Star,
        label: "Favorisieren",
        shortcut: "Strg + S"
    },
];

export const LABEL_OPTIONS = ["Dokumentation", "Fehler", "Feature"];