import React, { useState } from "react";
import Header from "./components/Header";
import ListView from "./components/ListView";
import KanbanView from "./components/KanbanView";

function App() {
  const [view, setView] = useState<"list" | "kanban">("list");

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Header view={view} setView={setView} />
      {view === "list" ? <ListView /> : <KanbanView />}
    </div>
  );
}

export default App;
