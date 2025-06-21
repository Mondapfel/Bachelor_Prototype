import React, { useState } from "react";
import Header from "./components/Header";
import ListView from "./pages/ListView/ListView";
import KanbanView from "./pages/KanbanView";

function App() {
  const [view, setView] = useState<"list" | "kanban">("list");

  return (
    <div className="min-h-screen bg-purple-100 dark:bg-blue-900 text-gray-900 dark:text-white">
      <Header view={view} setView={setView} />
      {view === "list" ? <ListView /> : <KanbanView />}
    </div>
  );
}

export default App;
