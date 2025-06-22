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
import { DropdownMenuCheckboxes } from "@/components/DropDowns/ViewColumnsDropDown";
import { tasksColumns } from "./TasksColumn";
import { TasksTable } from "./TaskTable";
import { tasks } from "@/data/TasksData";
import PaginationArea from "./pagination/PaginationArea";

export default function TaskArea() {
  return (
    <div className="px-7 mt-5">
      <Card className="dark:bg-blue-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SearchInput />
              <StatusDropDown />
              <PriorityDropDown />

              <Button variant={"ghost"} className="h-10">
                <span> Filter zurücksetzen</span>
                <X />
              </Button>
            </div>
            <DropdownMenuCheckboxes />
          </div>
        </CardHeader>
        <CardContent>
          <TasksTable columns={tasksColumns} data={tasks} />
        </CardContent>
        <CardFooter>
          <PaginationArea />
        </CardFooter>
      </Card>
    </div>
  );
}
