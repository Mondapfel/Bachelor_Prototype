import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PaginationSelection() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Zeilen pro Seite</span>
      <Select
      // value={pagination.pageSize.toString()}
      // onValueChange={(value) => {
      // setPagination((prevState) => ({
      // ...prevState,
      // pageSize: Number(value),
      // }));
      // }}
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
