import {
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { LABEL_OPTIONS } from "./constants";
import { Tag } from "lucide-react";
import type { Label } from "@/data/TasksData";

interface LabelSubMenuProps {
  value: Label;
  onValueChange: (value: Label) => void;
  onClickedLabelItem: (value: Label) => void;
}

export function LabelSubMenu({
  value,
  onValueChange,
  onClickedLabelItem,
}: LabelSubMenuProps) {
  const handleValueChange = (newValue: string) => {
    const newLabel = newValue as Label;
    onValueChange(newLabel);
    onClickedLabelItem(newLabel);
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Tag className="mr-2 h-4 w-4" />
        <span>Label</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={handleValueChange}
          >
            {LABEL_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {option}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}