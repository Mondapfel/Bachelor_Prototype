import React from "react";
import { Moon, Sun, RotateCcw } from "lucide-react";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type Props = {
  view: "list" | "kanban";
  setView: (view: "list" | "kanban") => void;
};

const Header: React.FC<Props> = ({ view, setView }) => {
  const { resetTasks } = useTasksDataStore();

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
    window.dispatchEvent(new Event("storage"));
  };

  const handleReset = () => {
    resetTasks();
    toast.success("Das Board wurde auf den Anfangszustand zurückgesetzt.");
  };

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-white dark:bg-slate-950 shadow">
      <h1 className="text-2xl font-bold">Tasky</h1>
      <div className="flex items-center gap-4">
        {/* --- Reset Button --- */}
        <Button
          className="opacity-0"
          variant="outline"
          size="icon"
          onClick={handleReset}
          title="Reset Board"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-md p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("list")}
            className={cn(
              "px-3 py-1 rounded-md",
              view === "list"
                ? "bg-blue-400 text-white hover:bg-blue-600 hover:text-white"
                : "hover:bg-gray-300 dark:hover:bg-gray-600"
            )}
          >
            Liste
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("kanban")}
            className={cn(
              "px-3 py-1 rounded-md",
              view === "kanban"
                ? "bg-blue-400 text-white hover:bg-blue-600 hover:text-white"
                : "hover:bg-gray-300 dark:hover:bg-gray-600"
            )}
          >
            Kanban
          </Button>
        </div>

        {/* --- Theme Toggle Button --- */}
        <Button className="rounded-md" variant="outline" size="icon" onClick={toggleTheme}>
          {document.documentElement.classList.contains("dark") ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default Header;
