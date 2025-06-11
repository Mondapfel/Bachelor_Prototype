import React, { useState } from "react";

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
      <h1 className="text-xl font-bold">My Task Board</h1>
      <div className="flex gap-4">
        <button
          onClick={() => setView(view === "list" ? "kanban" : "list")}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          Switch to {view === "list" ? "Kanban" : "List"} View
        </button>
        <button
          onClick={toggleTheme}
          className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-white rounded"
        >
          Toggle Theme
        </button>
      </div>
    </div>
  );
};

export default Header;
