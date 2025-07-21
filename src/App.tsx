import { Toaster } from "@/components/ui/sonner";
import Header from "./components/Header";
import KanbanView from "./pages/KanbanView/KanbanView";
import ListView from "./pages/ListView/ListView";
import { useEffect, useState, useRef, useCallback } from "react";
import { AdaptationModes, CURRENT_ADAPTATION_MODE } from "./lib/adaptionConfig";
import { useTasksDataStore } from "./hooks/useTasksDataStore";
import { useCheckedPrioritiesStore } from "./hooks/useCheckedPrioritiesStore";
import { useCheckedStatusStore } from "./hooks/useCheckedStatusStore";
import { getAdaptationDecision } from "./lib/ruleEngine";
import type { Priority, Status } from "./data/TasksData";

type PredictionResponse = {
  predicted_view: "kanban" | "list";
  predicted_status_filter: string;
  predicted_priority_filter: string;
};

function App() {
  const [view, setView] = useState<"kanban" | "list">("list");
  const { tasks, fetchTasks, lastModifiedTaskId } = useTasksDataStore();
  const { setCheckedPriorities } = useCheckedPrioritiesStore();
  const { setCheckedStatus } = useCheckedStatusStore();
  const [isLoading, setIsLoading] = useState(true);

  const isInitialLoad = useRef(true);

  // Effect to fetch initial task data when the component mounts
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // --- ADAPTATION FUNCTIONS ---

  const applyRuleBasedAdaptation = useCallback(() => {
    const currentTasks = useTasksDataStore.getState().tasks;
    if (!currentTasks) return;

    console.log("Applying rule-based adaptation...");
    const decision = getAdaptationDecision(currentTasks);

    setView(decision.view);

    if (decision.view === "list") {
      setCheckedStatus(decision.statusFilter as Status[]);
      setCheckedPriorities(decision.priorityFilter as Priority[]);
    } else {
      setCheckedStatus([]);
      setCheckedPriorities([]);
    }

    setIsLoading(false);
  }, [setCheckedStatus, setCheckedPriorities]);

  const applyMlAdaptation = useCallback(
    async (options?: { applyViewPrediction?: boolean }) => {
      const { tasks: currentTasks, lastCreatedTask: currentLastCreatedTask } =
        useTasksDataStore.getState();
      if (!currentTasks || currentTasks.length === 0) {
        setIsLoading(false);
        return;
      }

      const shouldApplyView = options?.applyViewPrediction ?? true;

      console.log(
        `ML Adaptation Mode: Fetching predictions... (Apply View: ${shouldApplyView})`
      );

      // --- Calculate all raw counts required by the model ---
      const now = new Date();
      const openTasks = currentTasks.filter((t) => t.status !== "Erledigt");

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

      const statusCounts = currentTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const num_pending = statusCounts["Start ausstehend"] || 0;
      const num_todo = statusCounts["Zu Erledigen"] || 0;
      const num_inprogress = statusCounts["In Bearbeitung"] || 0;
      const num_done = statusCounts["Erledigt"] || 0;
      const num_blocked = statusCounts["Blockiert"] || 0;

      const overdue_tasks = currentTasks.filter(
        (t) => t.status !== "Erledigt" && t.dueDate && new Date(t.dueDate) < now
      ).length;

      const due_today = currentTasks.filter(
        (t) =>
          t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString()
      ).length;

      // --- Payload structure ---
      const featurePayload = {
        number_of_tasks: currentTasks.length,
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
        time_of_day: now.getHours(),
        sorted_by: "none",
        last_task_created_label: currentLastCreatedTask?.label || "none",
        last_task_created_priority: currentLastCreatedTask?.priority || "none",
        last_task_created_status: currentLastCreatedTask?.status || "none",
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
          setCheckedStatus([]);
          setCheckedPriorities([]);
        }
      } catch (error) {
        console.error("Failed to fetch ML predictions:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [setCheckedStatus, setCheckedPriorities]
  );

  // --- EFFECT 1: Handle Initial Load ---
  // This effect runs only once when tasks are first successfully fetched.
  useEffect(() => {
    if (tasks && tasks.length > 0 && isInitialLoad.current) {
      console.log("Initial load: Triggering adaptation.");
      if (CURRENT_ADAPTATION_MODE === AdaptationModes.RULE_BASED) {
        applyRuleBasedAdaptation();
      } else if (CURRENT_ADAPTATION_MODE === AdaptationModes.AI) {
        applyMlAdaptation({ applyViewPrediction: true });
      }
      isInitialLoad.current = false;
    }
  }, [tasks, applyRuleBasedAdaptation, applyMlAdaptation]);

  // --- EFFECT 2: Handle Subsequent Significant Changes ---
  // This effect now safely runs ONLY when lastModifiedTaskId changes.
  useEffect(() => {
    if (isInitialLoad.current || !lastModifiedTaskId) {
      return;
    }

    console.log("Significant task modification: Triggering adaptation.");
    if (CURRENT_ADAPTATION_MODE === AdaptationModes.RULE_BASED) {
      applyRuleBasedAdaptation();
    } else if (CURRENT_ADAPTATION_MODE === AdaptationModes.AI) {
      applyMlAdaptation({ applyViewPrediction: true });
    }
  }, [lastModifiedTaskId, applyRuleBasedAdaptation, applyMlAdaptation]);

  // Handle manual view changes to override automatic adaptations
  const handleViewChange = (newView: "kanban" | "list") => {
    setView(newView);
    setCheckedStatus([]);
    setCheckedPriorities([]);
  };

  if (isLoading && isInitialLoad.current) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-2">
          {/* Loading SVG */}
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
          <p className="text-muted-foreground">Ansicht wird optimiert</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-100 dark:bg-blue-950 text-gray-900 dark:text-white">
      <Header view={view} setView={handleViewChange} />
      <main className="px-12 py-6">
        {view === "kanban" ? <KanbanView /> : <ListView />}
      </main>
      <Toaster />
    </div>
  );
}

export default App;
