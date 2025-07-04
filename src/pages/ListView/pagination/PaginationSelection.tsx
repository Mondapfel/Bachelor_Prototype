import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaginationProps } from "./PaginationArea";

export default function PaginationSelection({
  pagination,
  setPagination,
}: PaginationProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm  text-gray-500">Zeilen pro Seite</span>
      <Select
        value={pagination.pageSize.toString()}
        onValueChange={(value) => {
          setPagination((prevState) => ({
            ...prevState,
            pageSize: Number(value),
          }));
        }}
      >
        <SelectTrigger className="w-[90px]">
          <SelectValue placeholder="4" />
        </SelectTrigger>
        <SelectContent>
          {[4, 6, 8, 10, 15, 20, 30].map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
