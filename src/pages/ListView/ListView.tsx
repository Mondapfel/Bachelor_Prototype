import TaskArea from "./TaskArea";
import TaskDialog from "@/components/taskDialogue/taskDialog";

export default function ListView() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Aufgaben Board</h1>
        <div className="space-x-2">
          <TaskDialog />
        </div>
      </div>
      <TaskArea />
    </div>
  );
}
