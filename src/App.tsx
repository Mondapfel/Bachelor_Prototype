import { Toaster } from "@/components/ui/sonner";
import Header from "./components/Header";
import KanbanView from "./pages/KanbanView/KanbanView";
import ListView from "./pages/ListView/ListView";
import { useEffect, useState, useRef, useCallback } from "react";
import { AdaptationModes, CURRENT_ADAPTATION_MODE } from "./lib/adaptionConfig";
import { useTasksDataStore } from "./hooks/useTasksDataStore";
import { useCheckedPrioritiesStore } from "./hooks/useCheckedPrioritiesStore";
import { useCheckedStatusStore } from "./hooks/useCheckedStatusStore";

// This is a new type definition for the response from our Python backend
type PredictionResponse = {
  predicted_view: "kanban" | "list";
  predicted_status_filter: string;
  predicted_priority_filter: string;
};

function App() {
  const [view, setView] = useState<"kanban" | "list">("list");
  const { tasks, fetchTasks, lastCreatedTask } = useTasksDataStore();
  const { setCheckedPriorities } = useCheckedPrioritiesStore();
  const { setCheckedStatus } = useCheckedStatusStore();
  const [isLoading, setIsLoading] = useState(true);

  const isInitialLoad = useRef(true);
  const lastAdaptedTaskRef = useRef<string | null>(null);

  // Effect to fetch initial task data when the component mounts
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // --- REFACTORED ADAPTATION LOGIC ---
  const applyMlAdaptation = useCallback(
    async (options?: { applyViewPrediction?: boolean }) => {
      const shouldApplyView = options?.applyViewPrediction ?? true;

      if (!tasks || tasks.length === 0) {
        setIsLoading(false);
        return;
      }

      console.log(
        `ML Adaptation Mode: Fetching predictions... (Apply View: ${shouldApplyView})`
      );

      // --- MODIFIED: Calculate all raw counts required by the model ---
      const now = new Date();
      const openTasks = tasks.filter((t) => t.status !== "Erledigt");

      const num_critical_open = openTasks.filter(
        (t) => t.priority === "Kritisch"
      ).length;
      const num_high_open = openTasks.filter(
        (t) => t.priority === "Hoch"
      ).length;
      const num_medium_open = openTasks.filter(
        (t) => t.priority === "Mittel"
      ).length;
      const num_low_open = openTasks.filter(
        (t) => t.priority === "Niedrig"
      ).length;

      const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const num_pending = statusCounts["Start ausstehend"] || 0;
      const num_todo = statusCounts["Zu Erledigen"] || 0;
      const num_inprogress = statusCounts["In Bearbeitung"] || 0;
      const num_done = statusCounts["Erledigt"] || 0;
      const num_blocked = statusCounts["Blockiert"] || 0;

      const overdue_tasks = tasks.filter(
        (t) => t.status !== "Erledigt" && t.dueDate && new Date(t.dueDate) < now
      ).length;

      const due_today = tasks.filter(
        (t) =>
          t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString()
      ).length;

      // --- MODIFIED: This is the correct payload structure ---
      const featurePayload = {
        number_of_tasks: tasks.length,
        num_critical_open,
        num_high_open,
        num_medium_open,
        num_low_open,
        num_pending,
        num_todo,
        num_inprogress,
        num_done,
        num_blocked,
        overdue_tasks,
        due_today,
        time_of_day: now.getHours(), // Using real time instead of hardcoded value
        sorted_by: "none", // This is still hardcoded and a limitation
        last_task_created_label: lastCreatedTask?.label || "none",
        last_task_created_priority: lastCreatedTask?.priority || "none",
        last_task_created_status: lastCreatedTask?.status || "none",
      };

      try {
        const response = await fetch("http://127.0.0.1:5000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(featurePayload),
        });

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const prediction: PredictionResponse = await response.json();
        console.log("Received prediction:", prediction);

        if (shouldApplyView) {
          setView(prediction.predicted_view);
        }

        if (prediction.predicted_view === "list") {
          if (prediction.predicted_status_filter !== "none") {
            setCheckedStatus([prediction.predicted_status_filter] as any);
          } else {
            setCheckedStatus([]);
          }

          if (prediction.predicted_priority_filter !== "none") {
            setCheckedPriorities([prediction.predicted_priority_filter] as any);
          } else {
            setCheckedPriorities([]);
          }
        } else {
          // If the prediction is kanban, clear filters
          setCheckedStatus([]);
          setCheckedPriorities([]);
        }
      } catch (error) {
        console.error("Failed to fetch ML predictions:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [tasks, lastCreatedTask, setCheckedStatus, setCheckedPriorities]
  );

  // Effect for initial load and new task creation
  useEffect(() => {
    if (CURRENT_ADAPTATION_MODE !== AdaptationModes.AI || !tasks) {
      setIsLoading(false);
      return;
    }

    const isNewTaskEvent =
      lastCreatedTask && lastCreatedTask.taskId !== lastAdaptedTaskRef.current;

    if (isInitialLoad.current || isNewTaskEvent) {
      applyMlAdaptation({ applyViewPrediction: true });
      isInitialLoad.current = false;
      if (isNewTaskEvent) {
        lastAdaptedTaskRef.current = lastCreatedTask.taskId;
      }
    }
  }, [tasks, lastCreatedTask, applyMlAdaptation]);

  // --- NEW: Handler for manual view changes ---
  const handleViewChange = (newView: "kanban" | "list") => {
    // Update the view immediately for a responsive feel
    setView(newView);

    // If the user switches to the list view, trigger a filter-only adaptation
    if (newView === "list" && CURRENT_ADAPTATION_MODE === AdaptationModes.AI) {
      applyMlAdaptation({ applyViewPrediction: false });
    } else {
      // If switching to Kanban, always clear filters
      setCheckedStatus([]);
      setCheckedPriorities([]);
    }
  };

  if (isLoading && isInitialLoad.current) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-2">
          <svg
            className="animate-spin h-8 w-8 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-muted-foreground">
            Intelligente Ansicht wird geladen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-100 dark:bg-blue-950 text-gray-900 dark:text-white">
      {/* Pass the new handler to the Header */}
      <Header view={view} setView={handleViewChange} />
      <main className="px-12 py-6">
        {view === "kanban" ? <KanbanView /> : <ListView />}
      </main>
      <Toaster />
    </div>
  );
}

export default App;
