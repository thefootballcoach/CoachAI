import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUpload: (file: File) => void;
  onRemove?: () => void;
  currentImageUrl?: string;
  isUploading?: boolean;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  variant?: "avatar" | "logo" | "default";
}

export function ImageUpload({
  onUpload,
  onRemove,
  currentImageUrl,
  isUploading = false,
  label = "Upload Image",
  accept = "image/*",
  maxSize = 5,
  className,
  variant = "default"
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onUpload(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onRemove?.();
  };

  const displayUrl = previewUrl || currentImageUrl;

  const getVariantStyles = () => {
    switch (variant) {
      case "avatar":
        return "w-24 h-24 rounded-full";
      case "logo":
        return "w-32 h-24 rounded-lg";
      default:
        return "w-full h-32 rounded-lg";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      <div
        className={cn(
          "relative border-2 border-dashed transition-colors",
          dragActive ? "border-primary bg-primary/10" : "border-gray-300",
          displayUrl ? "border-solid border-gray-200" : "",
          getVariantStyles()
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {displayUrl ? (
          <div className="relative w-full h-full">
            <img
              src={displayUrl}
              alt="Uploaded"
              className={cn(
                "w-full h-full object-cover",
                variant === "avatar" ? "rounded-full" : "rounded-lg"
              )}
            />
            {!isUploading && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 w-6 h-6 p-0"
                onClick={handleRemove}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-500 hover:text-gray-700"
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {variant === "avatar" ? "Upload photo" : "Upload image"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Drag & drop or click to select
                  </p>
                  <p className="text-xs text-gray-400">
                    Max {maxSize}MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}