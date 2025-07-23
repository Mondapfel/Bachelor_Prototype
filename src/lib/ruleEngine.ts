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
  const blockedTasks = openTasks.filter((task) => task.status === "Blockiert");
  const backlogTasks = openTasks.filter((task) => task.status === 'Zu Erledigen' || task.status === 'Start ausstehend');
  const dueTodayTasks = openTasks.filter((task) => task.dueDate && new Date(task.dueDate).toDateString() === now.toDateString());
  const doneTasks = tasks.filter(t => t.status === 'Erledigt');

  const calculateStandardDeviation = (numbers: number[]): number => {
    if (numbers.length < 2) return 0;
    const mean = numbers.reduce((acc, val) => acc + val, 0) / numbers.length;
    const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
};
  const tasksPerStatus = openTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<Status, number>);
  const statusCounts = Object.values(tasksPerStatus);
  const statusStandardDeviation = calculateStandardDeviation(statusCounts);


  // --- RULE EVALUATION (from highest to lowest priority) ---

  // Rule 1: Emergency
  // If there are critical tasks that are overdue, focus on them immediately.
  // Action: Switch to List view and filter by "Kritisch" priority.
  if (overdueTasks.some((task) => task.priority === "Kritisch")) {
    decision.view = "list";
    decision.priorityFilter = ["Kritisch"];
    console.log("Rule applied: Emergency - Overdue Critical Tasks");
    return decision;
  }

  // New Rule 2: Overdue Warning
  // If non-critical tasks are overdue, they still need attention.
  // Action: Switch to List view and filter by 'Hoch' priority to tackle the most important late items.
  if (overdueTasks.length > 0) {
    decision.view = "list";
    decision.priorityFilter = ["Hoch"];
    console.log("Rule applied: Overdue Warning - Non-critical tasks are late.");
    return decision;
  }

  // Rule 3: Blockage
  // If any task is blocked, it's a high-priority issue to resolve.
  // Action: Switch to List view and filter to show only "Blockiert" tasks.
  if (blockedTasks.length > 0) {
    decision.view = "list";
    decision.statusFilter = ["Blockiert"];
    console.log("Rule applied: Blockage - Blocked tasks need attention");
    return decision;
  }

  // Rule 4: Focus on Today
  // If multiple tasks are due today, help the user focus on them.
  // Action: Switch to List view and filter for open tasks due today.
  if (dueTodayTasks.length >= 2) {
    decision.view = "list";
    decision.statusFilter = ["Start ausstehend", "Zu Erledigen", "In Bearbeitung", "Blockiert"];
    console.log("Rule applied: Focus on Today - Tasks are due!");
    return decision;
  }

  // Rule 5: Balanced Workflow (Entropy)
  // If tasks are evenly distributed across multiple columns (low standard deviation),
  // the workflow is balanced and well-suited for a Kanban board.
  // A threshold of 2.5 means the number of tasks in each column is generally close.
  if (statusCounts.length >= 3 && statusStandardDeviation < 2.5) {
    decision.view = "kanban";
    console.log(`Rule applied: Balanced Workflow - Status spread is even (StdDev: ${statusStandardDeviation.toFixed(2)})`);
    return decision;
  }

  // Rule 6: Planning Mode
  // If the backlog is large, a list view is better for planning and prioritizing.
  // Action: Switch to List view and show the backlog.
  if (backlogTasks.length / openTasks.length >= 0.6) {
      decision.view = 'list';
      decision.statusFilter = ['Zu Erledigen', 'Start ausstehend'];
      console.log("Rule applied: Planning Mode - Large backlog");
      return decision;
  }

  // Rule 7: Finishing Up
  // If almost all tasks are done, help the user focus on the remaining few.
  // Action: Switch to List view and filter to show only the open tasks.
  if (tasks.length > 5 && doneTasks.length / tasks.length >= 0.8) {
    decision.view = 'list';
    // Filter to show all statuses that are not "Erledigt"
    decision.statusFilter = ["Start ausstehend", "Zu Erledigen", "In Bearbeitung", "Blockiert"];
    console.log("Rule applied: Finishing Up - Almost done!");
    return decision;
  }

  // Rule 8: Default Fallback
  // If no specific rules are met, choose a sensible default based on task count.
  // Action: Kanban for few tasks, List for many.
  decision.view = openTasks.length > 10 ? "list" : "kanban";
  console.log(`Rule applied: Default Fallback -> ${decision.view}`);
  return decision;
};