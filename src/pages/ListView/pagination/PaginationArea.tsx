import { Button } from "@/components/ui/button";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import PaginationSelection from "./PaginationSelection";

export default function PaginationArea() {
  return (
    <div
      className={`relative w-full overflow-hidden flex justify-between items-center mt-2`}
    >
      <span className="text-slate-600 text-sm">
        0 von 36 Zeilen ausgewählt.
      </span>
      <div className="flex items-center gap-14">
        <PaginationSelection />
        <div className="flex gap-6 items-center">
          <span className="text-sm font-medium">
            {/* Page {pagination.pageIndex + 1} of {table.getPageCount()}*/}
            Seite 1 von 4
          </span>

          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              className="size-9 w-12"
              size="sm"
              //onClick={() => table.setPageIndex(0)}
              //disabled={!table.getCanPreviousPage()}
            >
              <ChevronFirst />
            </Button>
            <Button
              variant="outline"
              className="size-9 w-12"
              size="sm"
              //onClick={() => table.previousPage()}
              //disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-9 w-12"
              size="sm"
              //onClick={() => table.nextPage()}
              //disabled={!table.getCanNextPage()}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              className="size-9 w-12"
              size="sm"
              //onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              //disabled={!table.getCanNextPage()}
            >
              <ChevronLast />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
