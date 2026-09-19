import { useRef, useState } from "react";
import { UploadCloud, File, X, Check, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { ingestApi } from "../../api/ingestApi";

export default function FileUpload({ quizId, files, setFiles }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (selectedFiles) => {
    Array.from(selectedFiles).forEach((file) => {
      const fileObj = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        progress: 0,
        uploaded: false,
        error: false,
        uploading: true,
        resourceId: null,
      };
      setFiles((prev) => [...prev, fileObj]);
      uploadSingleFile(fileObj);
    });
  };

  const uploadSingleFile = async (fileObj) => {
    const formData = new FormData();
    formData.append("file", fileObj.file);

    try {
      const res = await ingestApi.uploadFile(formData, quizId);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? {
                ...f,
                uploaded: true,
                progress: 100,
                uploading: false,
                resourceId: res.data.resource_id,
              }
            : f,
        ),
      );
    } catch (error) {
      console.error("Upload failed for file:", fileObj.name, error);
      toast.error(`Failed to upload "${fileObj.name}"`);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? { ...f, error: true, uploading: false, progress: 0 }
            : f,
        ),
      );
    }
  };

  const handleRemove = async (fileObj) => {
    if (fileObj.resourceId && quizId) {
      try {
        await ingestApi.deleteResource(quizId, fileObj.resourceId);
      } catch (err) {
        console.error("Failed to delete resource from server:", err);
      }
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileObj.id));
  };

  const handleRetry = (fileObj) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileObj.id
          ? { ...f, error: false, uploading: true, progress: 0 }
          : f,
      ),
    );
    uploadSingleFile(fileObj);
  };

  return (
    <div className="h-full flex flex-col">
      <div
        className={`
                    flex-1 flex flex-col items-center justify-center
                    border-2 border-dashed rounded-xl transition-all duration-200 mt-2
                    ${
                      dragActive
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10"
                        : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                    }
                `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        />

        <div className="text-center p-8">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <UploadCloud size={32} />
          </div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            Select a file or drag and drop here
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
            PDF or TXT file, up to 10MB. Files upload automatically.
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            className="px-6 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Select Files
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Attached Files
          </p>

          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onRemove={() => handleRemove(file)}
              onRetry={() => handleRetry(file)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileCard({ file, onRemove, onRetry }) {
  return (
    <div
      className={`p-4 rounded-xl border shadow-sm flex items-center gap-4 ${
        file.error
          ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          file.error
            ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
        }`}
      >
        {file.error ? <AlertCircle size={20} /> : <File size={20} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
            {file.name}
          </p>
          <p className="text-xs text-slate-500 ml-2 whitespace-nowrap">
            {file.size}
          </p>
        </div>

        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              file.error
                ? "bg-red-500"
                : file.uploaded
                  ? "bg-green-500"
                  : "bg-indigo-600"
            }`}
            style={{
              width: `${file.error ? 100 : file.uploaded ? 100 : file.progress}%`,
            }}
          />
        </div>

        {file.error && (
          <p className="text-xs text-red-500 mt-1">
            Upload failed.{" "}
            <button
              onClick={onRetry}
              className="underline font-semibold hover:text-red-700"
            >
              Retry
            </button>
          </p>
        )}
      </div>

      <button
        onClick={onRemove}
        disabled={file.uploading && !file.error}
        className="text-slate-400 hover:text-red-500 transition p-1 disabled:opacity-30"
      >
        {file.uploaded ? (
          <Check size={20} className="text-green-500" />
        ) : (
          <X size={20} />
        )}
      </button>
    </div>
  );
}
