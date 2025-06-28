import { type FilterFn } from "@tanstack/react-table";
import { type Task } from "@/data/TasksData";

export const priorityFilter: FilterFn<Task> = (
  row,
  columnId,
  filterValue: string,
) => {
  const priority: string = row.getValue(columnId);
  return filterValue.includes(priority);
};
