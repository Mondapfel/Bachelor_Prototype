import {
  type ColumnDef,
  type FilterFn,
  flexRender,
  type Table,
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

declare module "@tanstack/table-core" {
  interface FilterFns {
    titleFilter: FilterFn<Task>;
    priorityFilter: FilterFn<Task>;
    statusFilter: FilterFn<Task>;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  table: Table<Task>;
}

export function TasksTable<TData extends Task, TValue>({
  columns,
  table,
}: DataTableProps<TData, TValue>) {
  return (
    <div className="rounded-md border mt-2">
      <ShadcnTable>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                className="h-12"
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Keine Tasks gefunden.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </ShadcnTable>
    </div>
  );
}
