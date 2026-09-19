import { useState } from "react";
import { Link2, FileUp, Globe, CheckCircle2 } from "lucide-react";
import FileUpload from "./FileUpload";

export default function Sources({ quizId, files, setFiles, urls, setUrls }) {
  const [selectedType, setSelectedType] = useState("file");
  const [urlInput, setUrlInput] = useState("");

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setUrls((prev) => [...prev, urlInput.trim()]);
    setUrlInput("");
  };

  const handleRemoveUrl = (urlToRemove) => {
    setUrls((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const renderInputArea = () => {
    switch (selectedType) {
      case "file":
        return <FileUpload quizId={quizId} files={files} setFiles={setFiles} />;
      case "link":
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Add Website Links
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/article"
                className="
                                    flex-1 p-3 rounded-xl 
                                    bg-slate-50 dark:bg-slate-900 
                                    border border-slate-200 dark:border-slate-700
                                    focus:ring-2 focus:ring-indigo-500 outline-none
                                    text-slate-800 dark:text-slate-200
                                "
              />
              <button
                onClick={handleAddUrl}
                className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl hover:opacity-90 transition"
              >
                Add
              </button>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-3">
                Added Links
              </p>
              {urls.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No links added yet.
                </p>
              )}
              {urls.map((url, idx) => (
                <div
                  key={idx}
                  className="p-4 mb-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Globe size={16} />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate">
                      {url}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveUrl(url)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
      {/* Sidebar - Source Selection */}
      <div className="md:col-span-4 lg:col-span-3 flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        <SourceBtn
          icon={<FileUp size={20} />}
          text="Upload File"
          desc="PDF, Images, Docs"
          active={selectedType === "file"}
          onClick={() => setSelectedType("file")}
        />
        <SourceBtn
          icon={<Link2 size={20} />}
          text="Website Link"
          desc="Articles, Blogs"
          active={selectedType === "link"}
          onClick={() => setSelectedType("link")}
        />
      </div>

      {/* Input Area */}
      <div className="md:col-span-8 lg:col-span-9 h-full min-h-[400px]">
        {renderInputArea()}
      </div>
    </div>
  );
}

function SourceBtn({ icon, text, desc, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
                flex items-center gap-4 p-4 rounded-xl text-left border transition-all duration-200 w-full min-w-[200px] md:min-w-0
                ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }
            `}
    >
      <div
        className={`
                w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}
            `}
      >
        {icon}
      </div>
      <div>
        <p
          className={`font-semibold ${active ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-200"}`}
        >
          {text}
        </p>
        <p
          className={`text-xs ${active ? "text-indigo-600 dark:text-indigo-300" : "text-slate-500"}`}
        >
          {desc}
        </p>
      </div>
      {active && (
        <CheckCircle2
          size={16}
          className="ml-auto text-indigo-600 dark:text-indigo-400"
        />
      )}
    </button>
  );
}
