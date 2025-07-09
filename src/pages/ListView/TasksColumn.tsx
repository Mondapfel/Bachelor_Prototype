import type { Priority, Status, Task } from "@/data/TasksData";
import { Badge } from "@/components/ui/badge";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  CircleCheckBig,
  Circle,
  CircleDashed,
  CircleOff,
  CircleFadingArrowUp,
  ArrowBigDown,
  ArrowBigUp,
  ShieldAlert,
  ChevronsLeftRightEllipsis,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Star,
  EyeOff,
} from "lucide-react";
import { TaskDropDown } from "@/components/DropDowns/TasksDropDown/tasksDropDown";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";
import { useOpenDialogStore } from "@/hooks/useOpenDialogStore";

const getPriorityClass = (priority: string | undefined) => {
  switch (priority) {
    case "Kritisch":
      return "text-purple-500";
    case "Hoch":
      return "text-red-500";
    case "Mittel":
      return "text-yellow-500";
    case "Niedrig":
      return "text-green-500";
    default:
      return "text-gray-400";
  }
};

const getLabelStyling = (label: string | undefined): string => {
  if (!label) return "";
  const blueLabels = ["Bug", "Feature", "Dokumentation"];
  if (blueLabels.includes(label)) {
    return "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-800/50 dark:border-blue-900 dark:text-blue-300 border border-dashed";
  }
  return "";
};

function renderStatusIcons(status: Status) {
  switch (status) {
    case "Start ausstehend":
      return CircleDashed;
    case "Zu Erledigen":
      return Circle;
    case "In Bearbeitung":
      return CircleFadingArrowUp;
    case "Erledigt":
      return CircleCheckBig;
    case "Blockiert":
      return CircleOff;
    default:
      break;
  }
}

function renderPriorityIcons(priority: Priority) {
  switch (priority) {
    case "Niedrig":
      return ArrowBigDown;
    case "Mittel":
      return ChevronsLeftRightEllipsis;
    case "Hoch":
      return ArrowBigUp;
    case "Kritisch":
      return ShieldAlert;
    default:
      break;
  }
}

function formatDate(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  return `${day}. ${month} ${year}`;
}

type SortableHeaderProps = {
  column: Column<Task, unknown>;
  label: string;
};

const SortableHeader: React.FC<SortableHeaderProps> = ({ column, label }) => {
  const isSorted = column.getIsSorted();
  const SortingIcon =
    isSorted === "asc"
      ? ArrowUp
      : isSorted === "desc"
      ? ArrowDown
      : ArrowUpDown;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="" asChild>
        <div
          className={`flex items-start py-[14px] select-none cursor-pointer p-2 gap-1 ${
            isSorted && "text-primary"
          }`}
          aria-label={`Sort by ${label}`}
        >
          {label}
          <SortingIcon className="h-4 w-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom">
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <ArrowUp className="mr-2 h-4 w-4" />
          Auf
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <ArrowDown className="mr-2 h-4 w-4" />
          Ab
        </DropdownMenuItem>
        {label !== "Titel" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                column.toggleVisibility();
              }}
            >
              <EyeOff className="mr-2 size-5 opacity-90" />
              Verstecken
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const tasksColumns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "taskId",
    header: "Task",
  },
  {
    accessorKey: "isFavorite",
    header: "",
    cell: ({ row }) => {
      const FavoriteIcon = row.original.isFavorite && Star;
      return (
        FavoriteIcon && <FavoriteIcon size={14} className="text-yellow-400" />
      );
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Titel" />,
    cell: ({ row }) => {
      const taskLabel = row.original.label;
      const taskTitle = row.original.title;
      const customLabelStyle = getLabelStyling(taskLabel);

      return (
        <div className="flex items-center gap-2">
          {taskLabel && (
            <Badge
              variant={customLabelStyle ? "outline" : "secondary"}
              className={customLabelStyle}
            >
              {taskLabel}
            </Badge>
          )}
          <span>{taskTitle}</span>
        </div>
      );
    },
    filterFn: "titleFilter",
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => {
      const StatusIcon = renderStatusIcons(row.original.status);
      const status = row.original.status;
      return (
        <div className="flex items-center gap-2 text-sm">
          {StatusIcon && (
            <StatusIcon
              size={17}
              className="text-gray-600 backdrop-opacity-95"
            />
          )}
          <span>{status}</span>
        </div>
      );
    },
    filterFn: "statusFilter",
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <SortableHeader column={column} label="Priorität" />
    ),
    cell: ({ row }) => {
      const priority = row.original.priority;
      const PriorityIcon = renderPriorityIcons(priority);
      const priorityColor = getPriorityClass(priority);

      return (
        <div className="flex items-center gap-2 text-sm">
          {PriorityIcon && <PriorityIcon className={priorityColor} />}
          <span className={priorityColor}>{priority}</span>
        </div>
      );
    },
    filterFn: "priorityFilter",
  },
  {
    accessorKey: "erstellt am",
    header: ({ column }) => (
      <SortableHeader column={column} label="Erstellt am" />
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt;
      const formattedDate = formatDate(date);

      return formattedDate;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <ShowTaskDropDown task={row.original} />;
    },
  },
];

function ShowTaskDropDown({ task }: { task: Task }) {
  const { setSelectedTask } = useTasksDataStore();
  const { isOpen } = useOpenDialogStore();

  return (
    <TaskDropDown
      onOpen={() => setSelectedTask(task)}
      onClose={() => {
        if (!isOpen) {
          setSelectedTask(null);
        }
      }}
    />
  );
}
