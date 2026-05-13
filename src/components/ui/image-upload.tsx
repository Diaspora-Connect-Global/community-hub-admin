import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  previewClassName?: string;
  placeholder?: string;
  /**
   * Optional. When provided, picking a file does NOT inline the image as a
   * base64 data URL — instead the raw `File` is passed back via this callback
   * (paired with a blob/object URL through `onChange` for preview only).
   *
   * Consumers that wire this up are expected to upload the file via a signed
   * URL flow at submit time and replace the preview URL with the resulting
   * public URL before sending it to any GraphQL mutation.
   *
   * Without this prop the legacy `readAsDataURL` behaviour is preserved for
   * back-compat with other consumers in the app.
   */
  onFileChange?: (file: File | null) => void;
}

export function ImageUpload({
  value,
  onChange,
  className,
  previewClassName = "w-20 h-20 rounded-full",
  placeholder = "Upload an image",
  onFileChange,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track any object URL we created so it can be revoked on unmount / replacement.
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleFileChange = useCallback(
    (file: File) => {
      if (!file || !file.type.startsWith("image/")) return;

      if (onFileChange) {
        // File-based mode: emit the File and use an object URL for preview only.
        // This avoids stuffing a multi-MB base64 data URL into form state.
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        const previewUrl = URL.createObjectURL(file);
        objectUrlRef.current = previewUrl;
        onFileChange(file);
        onChange(previewUrl);
        return;
      }

      // Legacy back-compat path: encode as base64 data URL.
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
      };
      reader.readAsDataURL(file);
    },
    [onChange, onFileChange]
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

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileChange(file);
      }
    },
    [handleFileChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      onFileChange?.(null);
      onChange(urlInput.trim());
    }
  };

  const handleClear = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    onChange("");
    setUrlInput("");
    onFileChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div
          className={cn(
            "relative bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-colors",
            isDragging && "border-primary bg-primary/10",
            previewClassName
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          {value ? (
            <>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Image className="h-6 w-6" />
              {isDragging && <span className="text-xs">Drop here</span>}
            </div>
          )}
        </div>

        {/* Upload Options */}
        <div className="flex-1">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="upload" className="text-xs">Upload File</TabsTrigger>
              <TabsTrigger value="url" className="text-xs">Image URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-2 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <p className="text-xs text-muted-foreground">
                Or drag & drop an image onto the preview
              </p>
            </TabsContent>
            <TabsContent value="url" className="mt-2 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={placeholder ?? "Enter image URL..."}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUrlSubmit}
                >
                  Load
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
