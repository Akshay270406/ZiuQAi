import { useRef, useState } from "react";
import {
  UploadCloud,
  File,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { ingestApi } from "../../api/ingestApi";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".txt",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
];

export default function FileUpload({
  quizId,
  files,
  setFiles,
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      event.type === "dragenter" ||
      event.type === "dragover"
    ) {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    if (
      event.dataTransfer.files &&
      event.dataTransfer.files.length > 0
    ) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const handleChange = (event) => {
    event.preventDefault();

    if (
      event.target.files &&
      event.target.files.length > 0
    ) {
      handleFiles(event.target.files);
      event.target.value = "";
    }
  };

  const handleFiles = (selectedFiles) => {
    Array.from(selectedFiles).forEach((file) => {
      const extension = (
        "." + file.name.split(".").pop()
      ).toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        toast.error(
          `${file.name}: unsupported file type.`
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `${file.name}: file must be 10 MB or smaller.`
        );
        return;
      }

      const fileObject = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: (
          file.size /
          1024 /
          1024
        ).toFixed(2) + " MB",
        progress: 0,
        uploaded: false,
        error: false,
        uploading: true,
        resourceId: null,
      };

      setFiles((previous) => [
        ...previous,
        fileObject,
      ]);

      uploadSingleFile(fileObject);
    });
  };

  const uploadSingleFile = async (fileObject) => {
    if (!fileObject.file) {
      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      fileObject.file
    );

    try {
      const response = await ingestApi.uploadFile(
        formData,
        quizId
      );

      setFiles((previous) =>
        previous.map((file) =>
          file.id === fileObject.id
            ? {
                ...file,
                uploaded: true,
                progress: 100,
                uploading: false,
                resourceId: response.data.resource_id,
              }
            : file
        )
      );

      toast.success(
        `${fileObject.name} uploaded successfully.`
      );

    } catch (error) {
      console.error(
        "Upload failed:",
        fileObject.name,
        error
      );

      toast.error(
        error.response?.data?.detail ||
        `Failed to upload ${fileObject.name}.`
      );

      setFiles((previous) =>
        previous.map((file) =>
          file.id === fileObject.id
            ? {
                ...file,
                error: true,
                uploading: false,
                progress: 0,
              }
            : file
        )
      );
    }
  };

  const handleRemove = async (fileObject) => {
    if (fileObject.resourceId && quizId) {
      try {
        await ingestApi.deleteResource(
          quizId,
          fileObject.resourceId
        );
      } catch (error) {
        console.error(
          "Failed to delete resource:",
          error
        );

        toast.error(
          "Could not remove the uploaded resource."
        );

        return;
      }
    }

    setFiles((previous) =>
      previous.filter(
        (file) => file.id !== fileObject.id
      )
    );
  };

  const handleRetry = (fileObject) => {
    setFiles((previous) =>
      previous.map((file) =>
        file.id === fileObject.id
          ? {
              ...file,
              error: false,
              uploading: true,
              progress: 0,
            }
          : file
      )
    );

    uploadSingleFile(fileObject);
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
          accept=".pdf,.txt,.doc,.docx,.ppt,.pptx"
        />

        <div className="text-center p-8">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <UploadCloud size={32} />
          </div>

          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            Select a file or drag and drop here
          </p>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
            PDF, TXT, DOC, DOCX, PPT or PPTX, up to 10 MB.
            Files upload automatically.
          </p>

          <button
            type="button"
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


function FileCard({
  file,
  onRemove,
  onRetry,
}) {
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
        {file.error
          ? <AlertCircle size={20} />
          : <File size={20} />
        }
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
              width: `${
                file.error
                  ? 100
                  : file.uploaded
                    ? 100
                    : file.progress
              }%`,
            }}
          />
        </div>

        {file.error && (
          <p className="text-xs text-red-500 mt-1">
            Upload failed.{" "}
            <button
              type="button"
              onClick={onRetry}
              className="underline font-semibold hover:text-red-700"
            >
              Retry
            </button>
          </p>
        )}

        {file.uploading && (
          <p className="text-xs text-indigo-500 mt-1">
            Uploading and processing...
          </p>
        )}

        {file.uploaded && (
          <p className="text-xs text-green-500 mt-1">
            Uploaded and processed successfully.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={file.uploading && !file.error}
        className="text-slate-400 hover:text-red-500 transition p-1 disabled:opacity-30"
        title="Remove file"
      >
        {file.uploaded
          ? <Check size={20} className="text-green-500" />
          : <X size={20} />
        }
      </button>
    </div>
  );
}
