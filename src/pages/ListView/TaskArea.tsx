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
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { titleFilter } from "./filters/titleFilter";
import { priorityFilter } from "./filters/priorityFilter";
import { statusFilter } from "./filters/statusFilter";
import { useEffect, useState } from "react";
import { TasksSelected } from "./TasksSelected";

export default function TasksArea() {
  const { setCheckedPriorities, checkedPriorities } =
    useCheckedPrioritiesStore();
  const { setCheckedStatuses, checkedStatuses } = useCheckedStatusesStore();
  const { tasks } = useTasksDataStore();

  const { query } = useQueryStore();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: tasks || [],
    columns: tasksColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      rowSelection,
      pagination,
      sorting,
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

    console.log(newFilters);

    setColumnFilters(newFilters);
  }, [query, checkedPriorities, checkedStatuses]);

  const selectedTasks = Object.keys(rowSelection)
    .map(Number)
    .map((index) => tasks?.[index]);

  return (
    <div className=" px-7 mt-5">
      <Card className="dark:bg-slate-900/80">
        <CardHeader>
          <div className="flex items-center justify-between">
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
                    <span>Zurücksetzen</span>
                    <X />
                  </Button>
                </>
              )}
            </div>

            <DropDownViewColumns table={table} />
          </div>
        </CardHeader>
        <TasksSelected
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          selectedTasks={selectedTasks}
        />
        <CardContent>
          {!tasks ? (
            <TableSkeleton />
          ) : (
            <TasksTable table={table} columns={tasksColumns} />
          )}
        </CardContent>
        <CardFooter>
          <PaginationArea
            pagination={pagination}
            setPagination={setPagination}
            table={table}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
