import type { Task, Priority, Status } from "@/data/TasksData";

// Structure for adaption decisions
type AdaptationDecision = {
  view: "kanban" | "list";
  statusFilter: Status[];
  priorityFilter: Priority[];
};

export const getAdaptationDecision = (tasks: Task[]): AdaptationDecision => {
  // Default decision: List view with no filters.
  const decision: AdaptationDecision = {
    view: "list",
    statusFilter: [],
    priorityFilter: [],
  };

  if (!tasks || tasks.length === 0) {
    return decision; // Return default if there are no tasks.
  }

  const openTasks = tasks.filter((task) => task.status !== "Erledigt");
  if (openTasks.length === 0) {
    decision.view = 'list'; // Show completed tasks in a list.
    decision.statusFilter = ['Erledigt'];
    return decision;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize time for accurate date comparison.

  // --- Analyze the current task state ---
  const overdueTasks = openTasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) < now
  );
  const criticalTasks = openTasks.filter((task) => task.priority === "Kritisch");
  const inProgressTasks = openTasks.filter(
    (task) => task.status === "In Bearbeitung"
  );
  const blockedTasks = openTasks.filter((task) => task.status === "Blockiert");
  const backlogTasks = openTasks.filter(task => task.status === 'Zu Erledigen' || task.status === 'Start ausstehend');


  // --- RULE EVALUATION (from highest to lowest priority) ---

  // **Rule 1: Emergency 🚨**
  // If there are critical tasks that are overdue, focus on them immediately.
  // Action: Switch to List view and filter by "Kritisch" priority.
  if (overdueTasks.some((task) => task.priority === "Kritisch")) {
    decision.view = "list";
    decision.priorityFilter = ["Kritisch"];
    console.log("Rule applied: Emergency - Overdue Critical Tasks");
    return decision;
  }

  // **Rule 2: Blockage 🚧**
  // If any task is blocked, it's a high-priority issue to resolve.
  // Action: Switch to List view and filter to show only "Blockiert" tasks.
  if (blockedTasks.length > 0) {
    decision.view = "list";
    decision.statusFilter = ["Blockiert"];
    console.log("Rule applied: Blockage - Blocked tasks need attention");
    return decision;
  }

  // **Rule 3: Workflow Focus  Kanban  Kanban**
  // If many tasks are being worked on, Kanban is best for visualizing progress.
  // Action: Switch to Kanban view.
  if (inProgressTasks.length / openTasks.length >= 0.4) {
      decision.view = "kanban";
      console.log("Rule applied: Workflow Focus - High number of tasks in progress");
      return decision;
  }

  // **Rule 4: Planning Mode 📝**
  // If the backlog is large, a list view is better for planning and prioritizing.
  // Action: Switch to List view and show the backlog.
  if (backlogTasks.length / openTasks.length >= 0.6) {
      decision.view = 'list';
      decision.statusFilter = ['Zu Erledigen', 'Start ausstehend'];
      console.log("Rule applied: Planning Mode - Large backlog");
      return decision;
  }

  // **Rule 5: Default Fallback**
  // If no specific rules are met, choose a sensible default based on task count.
  // Action: Kanban for few tasks, List for many.
  decision.view = openTasks.length > 8 ? "list" : "kanban";
  console.log(`Rule applied: Default Fallback -> ${decision.view}`);
  return decision;
};