import * as React from "react";
import { FileUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InlineLoader } from "./Loaders";

/**
 * File picker with drag-and-drop.
 *
 * Backs pile CSV import and evidence upload. Built on a real `<input
 * type="file">` behind a `<button>` rather than a div with drag handlers, so it
 * is keyboard-operable and announces itself correctly — a div-only dropzone is
 * unusable without a mouse.
 *
 * Validation here is a courtesy (type, size). The backend remains the
 * authority on whether a CSV's contents are acceptable.
 */
export interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  /** e.g. ".csv,text/csv" */
  accept?: string;
  multiple?: boolean;
  maxSizeBytes?: number;
  isUploading?: boolean;
  /** 0–100. Shows a determinate bar when provided. */
  progress?: number;
  disabled?: boolean;
  /** Guidance under the prompt, e.g. expected columns. */
  hint?: React.ReactNode;
  /** Currently staged files, so the caller can render and clear them. */
  files?: File[];
  onClear?: () => void;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({
  onFilesSelected,
  accept,
  multiple = false,
  maxSizeBytes,
  isUploading = false,
  progress,
  disabled = false,
  hint,
  files = [],
  onClear,
  className,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const accept_ = accept;

  const handleFiles = React.useCallback(
    (incoming: FileList | null) => {
      if (!incoming || incoming.length === 0) return;
      const list = Array.from(incoming);
      setError(null);

      if (maxSizeBytes) {
        const tooBig = list.find((file) => file.size > maxSizeBytes);
        if (tooBig) {
          setError(
            `${tooBig.name} is ${formatBytes(tooBig.size)}, over the ${formatBytes(maxSizeBytes)} limit.`,
          );
          return;
        }
      }

      onFilesSelected(multiple ? list : list.slice(0, 1));
    },
    [maxSizeBytes, multiple, onFilesSelected],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept_}
        multiple={multiple}
        disabled={disabled || isUploading}
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          // Reset so selecting the same file twice still fires a change event.
          event.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (disabled || isUploading) return;
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging
            ? "border-brand bg-brand-muted"
            : "hover:border-brand/40 hover:bg-muted/40",
          (disabled || isUploading) && "cursor-not-allowed opacity-60",
        )}
      >
        {isUploading ? (
          <InlineLoader label="Uploading" />
        ) : (
          <>
            <span className="rounded-full bg-muted p-2.5" aria-hidden="true">
              <FileUp className="h-5 w-5 text-muted-foreground" />
            </span>
            <span className="text-body font-medium">
              Drop a file here, or click to choose
            </span>
            {hint ? (
              <span className="text-caption text-muted-foreground">{hint}</span>
            ) : null}
          </>
        )}
      </button>

      {/* Drag state is visual only; this narrates it. */}
      <span className="sr-only" aria-live="polite">
        {isDragging ? "File ready to drop" : ""}
      </span>

      {typeof progress === "number" && isUploading ? (
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-brand transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {files.length > 0 ? (
        <ul className="space-y-1">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-caption"
            >
              <span className="min-w-0 truncate">{file.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {formatBytes(file.size)}
              </span>
              {onClear ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClear}
                  aria-label={`Remove ${file.name}`}
                >
                  <X aria-hidden="true" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
