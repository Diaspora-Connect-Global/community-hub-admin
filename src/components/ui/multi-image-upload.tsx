import { useState, useRef, useCallback } from "react";
import { Upload, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface MultiImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxFiles?: number;
  className?: string;
  accept?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  className,
  accept = "image/*,video/mp4",
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      
      const remainingSlots = maxFiles - value.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      
      filesToProcess.forEach((file) => {
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            onChange([...value, result]);
          };
          reader.readAsDataURL(file);
        }
      });
    },
    [value, onChange, maxFiles]
  );

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
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((src, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {src.startsWith("data:video") ? (
                <video src={src} className="w-full h-full object-cover" />
              ) : (
                <img src={src} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      {value.length < maxFiles && (
        <div
          className={cn(
            "border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging && "border-primary bg-primary/10",
            "hover:border-primary/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleInputChange}
            className="hidden"
          />
          <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {isDragging ? "Drop files here" : "Drag & drop images or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, MP4 (max {maxFiles} files)
          </p>
        </div>
      )}
    </div>
  );
}
