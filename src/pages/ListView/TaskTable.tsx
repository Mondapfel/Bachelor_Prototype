import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Task } from "@/data/TasksData";
import { useEffect, useState } from "react";
import { useQueryStore } from "@/hooks/useQueryStore";
import { useCheckedPrioritiesStore } from "@/hooks/useCheckedPrioritiesStore";
import { useCheckedStatusesStore } from "@/hooks/useCheckedStatusStore";
import { titleFilter } from "./filters/titleFilter";
import { priorityFilter } from "./filters/priorityFilter";
import { statusFilter } from "./filters/statusFilter";

declare module "@tanstack/table-core" {
  interface FilterFns {
    titleFilter: FilterFn<Task>;
    priorityFilter: FilterFn<Task>;
    statusFilter: FilterFn<Task>;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function TasksTable<TData extends Task, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const { query } = useQueryStore();
  const { checkedPriorities } = useCheckedPrioritiesStore();
  const { checkedStatuses } = useCheckedStatusesStore();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data,
    columns,
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

    // console.log(newFilters);

    setColumnFilters(newFilters);
  }, [query, checkedPriorities, checkedStatuses]);

  return (
    <div className="rounded-md border mt-2">
      <ShadcnTable>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </ShadcnTable>
    </div>
  );
}
