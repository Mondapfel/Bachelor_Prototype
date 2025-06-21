import React, { useState } from "react";
import { Moon, Sun } from "lucide-react";

type Props = {
  view: "list" | "kanban";
  setView: (view: "list" | "kanban") => void;
};

const Header: React.FC<Props> = ({ view, setView }) => {
  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
  };

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-800 shadow">
      <h1 className="text-xl font-bold">Task Board</h1>
      <div className="flex gap-4">
        <button
          onClick={() => setView(view === "list" ? "kanban" : "list")}
          className="px-3 py-1 bg-purple-400 text-white rounded"
        >
          Switch to {view === "list" ? "Kanban" : "List"} View
        </button>
        <button
          onClick={toggleTheme}
          className="px-3 py-1 bg-gray-400 dark:bg-gray-700 text-white rounded"
        >
          {document.documentElement.classList.contains("dark") ? (
            <Sun />
          ) : (
            <Moon />
          )}
        </button>
      </div>
    </div>
  );
};

export default Header;
