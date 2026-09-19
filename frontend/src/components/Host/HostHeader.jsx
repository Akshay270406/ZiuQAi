import React from "react";

export default function HostHeader({ onCreateQuiz }) {
  return (
    <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-4xl font-extrabold font-vend text-black dark:text-white">
          Host Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage your quizzes, track registrations, and view live results.
        </p>
      </div>
      <button
        onClick={onCreateQuiz}
        className="
                    px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl
                    shadow-md transition whitespace-nowrap
                "
      >
        Create New Quiz
      </button>
    </header>
  );
}
