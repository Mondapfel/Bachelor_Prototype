import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import SearchInput from "./SearchInput";
import { PriorityDropDown } from "@/components/DropDowns/PriorityDropDown";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { StatusDropDown } from "@/components/DropDowns/StatusDropDown";
import { DropDownViewColumns } from "@/components/DropDowns/ViewColumnsDropDown";
import { tasksColumns } from "./TasksColumn";
import { TasksTable } from "./TaskTable";
import PaginationArea from "./pagination/PaginationArea";
import { useCheckedPrioritiesStore } from "@/hooks/useCheckedPrioritiesStore";
import { useCheckedStatusesStore } from "@/hooks/useCheckedStatusStore";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";
import TableSkeleton from "./TableSkeleton";
import { useQueryStore } from "@/hooks/useQueryStore";
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { titleFilter } from "./filters/titleFilter";
import { priorityFilter } from "./filters/priorityFilter";
import { statusFilter } from "./filters/statusFilter";
import { useEffect, useState } from "react";

export default function TaskArea() {
  const { setCheckedPriorities, checkedPriorities } =
    useCheckedPrioritiesStore();
  const { setCheckedStatuses, checkedStatuses } = useCheckedStatusesStore();
  const { tasks } = useTasksDataStore();

  const { query } = useQueryStore();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data: tasks || [],
    columns: tasksColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
    },
    filterFns: { titleFilter, priorityFilter, statusFilter },
  });

  useEffect(() => {
    const newFilters: ColumnFiltersState = [];

    if (query) {
      newFilters.push({ id: "title", value: query });
    }

    if (checkedPriorities.length > 0) {
      newFilters.push({ id: "priority", value: checkedPriorities });
    }

    if (checkedStatuses.length > 0) {
      newFilters.push({ id: "status", value: checkedStatuses });
    }
    setColumnFilters(newFilters);
  }, [query, checkedPriorities, checkedStatuses]);

  return (
    <div className="px-7 mt-5">
      <Card className="dark:bg-blue-950">
        <CardHeader>
          <div className=" flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SearchInput />
              <StatusDropDown />
              <PriorityDropDown />

              {(checkedPriorities.length !== 0 ||
                checkedStatuses.length !== 0) && (
                <>
                  <Button
                    onClick={() => {
                      setCheckedPriorities([]);
                      setCheckedStatuses([]);
                    }}
                    variant={"ghost"}
                    className="h-10"
                  >
                    <span>Alle Filter zurücksetzen</span>
                    <X />
                  </Button>
                </>
              )}
            </div>
            <DropDownViewColumns table={table} />
          </div>
        </CardHeader>
        <CardContent>
          {!tasks ? (
            <TableSkeleton />
          ) : (
            <TasksTable table={table} columns={tasksColumns} />
          )}
        </CardContent>
        <CardFooter>
          <PaginationArea />
        </CardFooter>
      </Card>
    </div>
  );
}
