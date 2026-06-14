"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize, isImageFile, isPdfFile } from "@/lib/utils/format";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import type { UploadedFile } from "@/types";

interface FileUploadProps {
  onUpload: (file: UploadedFile) => void;
  onRemove?: () => void;
  existingFile?: {
    fileName?: string | null;
    fileKey?: string | null;
    fileUrl?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
  };
  disabled?: boolean;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function FileUpload({ onUpload, onRemove, existingFile, disabled }: FileUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setErrorMsg("");

    if (!ACCEPTED_FILE_TYPES.includes(file.type as never)) {
      setErrorMsg("Only JPEG, PNG, WebP, or PDF files are allowed");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg("File too large. Maximum size is 150MB");
      return;
    }

    setState("uploading");
    setProgress(0);

    try {
      // Step 1: Get presigned URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to get upload URL");
      }

      const { uploadUrl, fileKey, fileUrl } = await res.json();

      // Step 2: Upload to S3
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.statusText}`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      const uploaded: UploadedFile = {
        fileKey,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };

      setUploadedFile(uploaded);
      setState("success");
      onUpload(uploaded);
    } catch (error) {
      setState("error");
      setErrorMsg(
        error instanceof Error ? error.message : "Upload failed. Please try again."
      );
    }
  }, [onUpload]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const currentFile = uploadedFile
    ? { fileName: uploadedFile.fileName, fileSize: uploadedFile.fileSize, mimeType: uploadedFile.mimeType, fileUrl: uploadedFile.fileUrl, fileKey: uploadedFile.fileKey }
    : existingFile;

  // The S3 bucket is private, so link through the presigned-URL endpoint
  // rather than the public object URL (which returns AccessDenied).
  const viewUrl = currentFile?.fileKey
    ? `/api/files/view?key=${encodeURIComponent(currentFile.fileKey)}`
    : currentFile?.fileUrl;

  const FileIcon = currentFile?.mimeType
    ? isImageFile(currentFile.mimeType)
      ? Image
      : FileText
    : FileText;

  if (currentFile?.fileName && state !== "uploading") {
    return (
      <div className="flex items-center gap-3 p-3.5 bg-arnifi-bg rounded-xl border border-arnifi-border">
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileIcon className="w-5 h-5 text-primary-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-arnifi-ink truncate">
            {currentFile.fileName}
          </p>
          <p className="text-xs text-arnifi-muted">
            {formatFileSize(currentFile.fileSize ?? 0)}
            {state === "success" && (
              <span className="ml-2 text-emerald-600 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Uploaded
              </span>
            )}
          </p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => {
              setUploadedFile(null);
              setState("idle");
              onRemove?.();
            }}
            className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 text-arnifi-muted flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {viewUrl && (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 hover:underline ml-1"
          >
            View
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150",
          dragOver
            ? "border-primary-400 bg-primary-50"
            : "border-arnifi-border hover:border-primary-300 hover:bg-primary-50/30",
          disabled && "opacity-50 cursor-not-allowed",
          state === "error" && "border-red-300 bg-red-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          disabled={disabled}
        />

        {state === "uploading" ? (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
            <p className="text-sm text-arnifi-muted">Uploading… {progress}%</p>
            <div className="w-full bg-arnifi-border rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-200 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-arnifi-ink">
                <span className="text-primary-600">Click to upload</span> or drag &amp; drop
              </p>
              <p className="text-xs text-arnifi-muted mt-0.5">
                PDF, JPEG, PNG, WebP — max 150MB
              </p>
            </div>
          </div>
        )}
      </div>

      {state === "error" && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
