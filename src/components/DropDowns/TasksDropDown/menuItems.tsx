import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import type { LucideIcon } from "lucide-react";

export function MenuItem({
  Icon,
  label,
  shortcut,
  className,
}: {
  Icon: LucideIcon;
  label: string;
  shortcut: string;
  className?: string;
}) {
  return (
    <DropdownMenuItem>
      <Icon className={`mr-2 h-4 w-4 ${className}`} />
      <span className={`${className}`}>{label}</span>
      {shortcut && (
        <DropdownMenuShortcut className={`${className}`}>
          {shortcut}
        </DropdownMenuShortcut>
      )}
    </DropdownMenuItem>
  );
}
