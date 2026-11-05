import { useState } from "react";
import {
  Link2,
  FileUp,
  Globe,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import FileUpload from "./FileUpload";

export default function Sources({
  quizId,
  files,
  setFiles,
  urls,
  setUrls,
}) {
  const [selectedType, setSelectedType] = useState("file");
  const [urlInput, setUrlInput] = useState("");

  const handleAddUrl = () => {
    const value = urlInput.trim();

    if (!value) return;

    try {
      const parsed = new URL(value);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error();
      }
    } catch {
      toast.error("Enter a valid HTTP or HTTPS website URL.");
      return;
    }

    if (urls.includes(value)) {
      toast.info("That website URL has already been added.");
      return;
    }

    setUrls((previous) => [...previous, value]);
    setUrlInput("");
  };

  const removeUrl = (value) =>
    setUrls((previous) =>
      previous.filter((url) => url !== value)
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
      <div className="md:col-span-4 lg:col-span-3 flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        <SourceButton
          icon={<FileUp size={20} />}
          text="Upload File"
          desc="PDF, Word, PowerPoint, TXT"
          active={selectedType === "file"}
          onClick={() => setSelectedType("file")}
        />

        <SourceButton
          icon={<Link2 size={20} />}
          text="Website Link"
          desc="Public articles and pages"
          active={selectedType === "link"}
          onClick={() => setSelectedType("link")}
        />
      </div>

      <div className="md:col-span-8 lg:col-span-9 h-full min-h-[400px]">
        {selectedType === "file" ? (
          <FileUpload
            quizId={quizId}
            files={files}
            setFiles={setFiles}
          />
        ) : (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Add Website Links
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(event) =>
                  setUrlInput(event.target.value)
                }
                onKeyDown={(event) =>
                  event.key === "Enter" && handleAddUrl()
                }
                placeholder="https://example.com/article"
                className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
              />

              <button
                type="button"
                onClick={handleAddUrl}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition"
              >
                Add URL
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Public HTTP/HTTPS pages containing readable
              HTML or plain text are supported. Private/local
              network URLs and redirect-only links are blocked.
            </p>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-3">
                URLs waiting to be ingested ({urls.length})
              </p>

              {urls.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No links added yet.
                </p>
              ) : (
                urls.map((url) => (
                  <div
                    key={url}
                    className="p-4 mb-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Globe size={16} />
                      </div>

                      <span className="text-sm text-slate-600 dark:text-slate-300 break-all">
                        {url}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeUrl(url)}
                      aria-label="Remove URL"
                      className="shrink-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function SourceButton({
  icon,
  text,
  desc,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-xl text-left border transition-all duration-200 w-full min-w-[200px] md:min-w-0 ${
        active
          ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 shadow-sm"
          : "bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          active
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 dark:bg-slate-700 text-slate-500"
        }`}
      >
        {icon}
      </div>

      <div>
        <p
          className={`font-semibold ${
            active
              ? "text-indigo-900 dark:text-indigo-100"
              : "text-slate-700 dark:text-slate-200"
          }`}
        >
          {text}
        </p>

        <p
          className={`text-xs ${
            active
              ? "text-indigo-600 dark:text-indigo-300"
              : "text-slate-500"
          }`}
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
