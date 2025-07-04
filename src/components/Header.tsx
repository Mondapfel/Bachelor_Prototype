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
    <div className="flex justify-between items-center px-6 py-4 bg-white dark:bg-slate-950 shadow">
      <h1 className="text-xl font-bold">Tasky</h1>
      <div className="flex gap-4">
        <button
          onClick={() => setView(view === "list" ? "kanban" : "list")}
          className="px-3 py-1 bg-blue-400 dark:bg-blue-800 text-white rounded hover:bg-gray-800 dark:hover:bg-gray-400"
        >
          Zu{view === "list" ? " Kanban" : "r Listen"} Ansicht wechseln
        </button>
        <button
          onClick={toggleTheme}
          className="px-3 py-1 bg-gray-400 dark:bg-gray-700 text-white rounded dark:hover:bg-gray-400 hover:bg-gray-800"
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
