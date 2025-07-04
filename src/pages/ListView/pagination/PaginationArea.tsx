"use client";

import { Button } from "@/components/ui/button";

import { GrFormPrevious, GrFormNext } from "react-icons/gr";
import { BiFirstPage, BiLastPage } from "react-icons/bi";
import PaginationSelection from "./PaginationSelection";
import type { Task } from "@/data/TasksData";
import type { Table } from "@tanstack/react-table";

import type { Dispatch, SetStateAction } from "react";
import { useTheme } from "next-themes";

export type PaginationType = {
  pageIndex: number;
  pageSize: number;
};

export type PaginationProps = {
  pagination: PaginationType;
  setPagination: Dispatch<SetStateAction<PaginationType>>;
};

type PaginationAreaProps = { table: Table<Task> } & PaginationProps;

export default function PaginationArea({
  table,
  pagination,
  setPagination,
}: PaginationAreaProps) {
  const { theme } = useTheme();

  //const bgColor = theme === "dark" ? "bg-gray-900 border-t" : "bg-white";

  return (
    <div className="relative w-full h-[84px] overflow-hidden flex justify-between items-center px-6">
      <PaginationSelection
        pagination={pagination}
        setPagination={setPagination}
      />
      <div className=" flex gap-6 items-center">
        <span className="text-sm  text-gray-500">
          Seite {pagination.pageIndex + 1} von {table.getPageCount()}
        </span>
        <div className="flex items-center justify-end space-x-2">
          {/* First Page Button */}
          <Button
            variant="outline"
            className="size-9 w-12"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <BiFirstPage />
          </Button>

          {/* Previous Page Button */}
          <Button
            variant="outline"
            className="size-9 w-12"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <GrFormPrevious />
          </Button>

          {/* Next Page Button */}
          <Button
            className="size-9 w-12"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <GrFormNext />
          </Button>

          {/* Last Page Button */}
          <Button
            className="size-9 w-12"
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <BiLastPage />
          </Button>
        </div>
      </div>
    </div>
  );
}
