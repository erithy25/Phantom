"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileAudio,
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import type { Course } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type UploadState = "idle" | "uploading" | "success" | "error";

interface LectureUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  onUploadComplete?: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Accepted Formats                                                           */
/* -------------------------------------------------------------------------- */

const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
];

const ACCEPTED_EXTENSIONS = ".mp3,.wav,.ogg,.webm,.mp4,.m4a";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function LectureUpload({
  open,
  onOpenChange,
  courses,
  onUploadComplete,
}: LectureUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [courseId, setCourseId] = useState<string>("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showCourseSelect, setShowCourseSelect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCourse = courses.find((c) => c.id === courseId);

  const reset = useCallback(() => {
    setFile(null);
    setCourseId("");
    setUploadState("idle");
    setProgress(0);
    setErrorMsg("");
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    if (uploadState !== "uploading") {
      reset();
      onOpenChange(false);
    }
  }, [uploadState, reset, onOpenChange]);

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(mp3|wav|ogg|webm|mp4|m4a)$/i)) {
      setErrorMsg("Unsupported file format. Please use MP3, WAV, OGG, WebM, MP4, or M4A.");
      return;
    }
    setFile(f);
    setErrorMsg("");
    setUploadState("idle");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleUpload = useCallback(async () => {
    if (!file || !courseId) return;

    setUploadState("uploading");
    setProgress(0);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);

      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(xhr.responseText || "Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

        xhr.open("POST", "/api/lectures/upload");
        xhr.send(formData);
      });

      setUploadState("success");
      setProgress(100);
      onUploadComplete?.();

      // Auto-close after success
      setTimeout(() => {
        reset();
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setUploadState("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }, [file, courseId, onUploadComplete, onOpenChange, reset]);

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent className="max-w-[520px]">
        <ModalHeader>
          <ModalTitle className="text-section-heading">
            Upload Lecture
          </ModalTitle>
          <ModalDescription>
            Upload an audio or video recording. Phantom will transcribe,
            summarize, and generate study materials.
          </ModalDescription>
        </ModalHeader>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative rounded-lg border-2 border-dashed p-8",
            "flex flex-col items-center justify-center text-center",
            "cursor-pointer transition-all duration-200",
            isDragging
              ? "border-phantom-text bg-phantom-accentBg"
              : file
                ? "border-phantom-borderHover bg-phantom-bgTertiary"
                : "border-phantom-border hover:border-phantom-borderHover hover:bg-phantom-accentBg"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />

          {file ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-phantom-accentBg border border-phantom-border flex items-center justify-center">
                <FileAudio className="w-5 h-5 text-phantom-textTertiary" />
              </div>
              <div className="text-left">
                <p className="text-body text-phantom-text font-medium truncate max-w-[280px]">
                  {file.name}
                </p>
                <p className="text-caption text-phantom-textMuted">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setUploadState("idle");
                }}
                className="ml-2 p-1 rounded-sm text-phantom-textMuted hover:text-phantom-text hover:bg-phantom-bgInput transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "w-12 h-12 rounded-full mb-3",
                  "bg-phantom-accentBg border border-phantom-border",
                  "flex items-center justify-center",
                  isDragging && "scale-110"
                )}
              >
                <Upload className="w-5 h-5 text-phantom-textTertiary" />
              </div>
              <p className="text-body text-phantom-textSecondary mb-1">
                Drag and drop your recording here
              </p>
              <p className="text-caption text-phantom-textMuted">
                MP3, WAV, OGG, M4A, or MP4 -- up to 500MB
              </p>
            </>
          )}
        </div>

        {/* Course Selection */}
        <div className="mt-4">
          <label className="text-label-mono text-phantom-textMuted block mb-1.5 uppercase">
            Course
          </label>
          <div className="relative">
            <button
              onClick={() => setShowCourseSelect(!showCourseSelect)}
              className={cn(
                "w-full flex items-center justify-between",
                "h-11 px-3.5 rounded-md",
                "border border-phantom-border bg-phantom-bgInput",
                "text-body",
                "hover:border-phantom-borderHover transition-colors",
                courseId ? "text-phantom-text" : "text-phantom-textMuted"
              )}
            >
              {selectedCourse
                ? `${selectedCourse.code} - ${selectedCourse.name}`
                : "Select a course..."}
              <ChevronDown className="w-4 h-4 text-phantom-textMuted" />
            </button>

            {showCourseSelect && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "absolute left-0 right-0 top-full mt-1 z-10",
                  "max-h-[200px] overflow-y-auto",
                  "rounded-md border border-phantom-border",
                  "bg-phantom-bgCard shadow-phantom-lg p-1"
                )}
              >
                {courses.length === 0 ? (
                  <p className="px-3 py-2 text-body text-phantom-textMuted">
                    No courses available
                  </p>
                ) : (
                  courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => {
                        setCourseId(course.id);
                        setShowCourseSelect(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xs text-body",
                        "hover:bg-phantom-bgInput transition-colors",
                        courseId === course.id
                          ? "text-phantom-text bg-phantom-accentBg"
                          : "text-phantom-textSecondary"
                      )}
                    >
                      <span className="font-mono text-phantom-textMuted mr-2">
                        {course.code}
                      </span>
                      {course.name}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploadState === "uploading" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-caption text-phantom-textSecondary">
                Uploading...
              </span>
              <span className="text-caption text-phantom-textMuted font-mono">
                {progress}%
              </span>
            </div>
            <Progress value={progress} />
          </motion.div>
        )}

        {/* Success Message */}
        {uploadState === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 p-3 rounded-md bg-phantom-success/10 border border-phantom-success/20"
          >
            <CheckCircle className="w-4 h-4 text-phantom-success shrink-0" />
            <span className="text-body text-phantom-success">
              Lecture uploaded successfully! Processing will begin shortly.
            </span>
          </motion.div>
        )}

        {/* Error Message */}
        {(uploadState === "error" || errorMsg) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 p-3 rounded-md bg-phantom-danger/10 border border-phantom-danger/20"
          >
            <AlertCircle className="w-4 h-4 text-phantom-danger shrink-0" />
            <span className="text-body text-phantom-danger">
              {errorMsg || "Upload failed. Please try again."}
            </span>
          </motion.div>
        )}

        {/* Footer */}
        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={uploadState === "uploading"}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpload}
            disabled={!file || !courseId || uploadState === "uploading" || uploadState === "success"}
          >
            {uploadState === "uploading" ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-phantom-bg/30 border-t-phantom-bg rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload
              </>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
