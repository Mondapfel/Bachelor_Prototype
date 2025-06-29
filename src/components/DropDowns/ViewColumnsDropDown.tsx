import * as React from "react";
import type { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns3Cog } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import type { Task } from "@/data/TasksData";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";

export function DropDownViewColumns({ table }: { table: Table<Task> }) {
  const { tasks } = useTasksDataStore();

  const columnsToHide = ["priorität", "status", "erstellt am"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={!tasks} variant="outline" className="h-11 px-8">
          <Columns3Cog />
          <span>Spalten</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter(
            (column) => column.getCanHide() && columnsToHide.includes(column.id)
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
