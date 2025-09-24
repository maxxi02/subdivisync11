"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { uploadImageToServer, validateImageFile, createImagePreview, revokeImagePreview } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
}

interface ImagePreview {
  url: string;
  file?: File;
  uploading?: boolean;
  error?: string;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  className,
  disabled = false,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const totalImages = images.length + fileArray.length;

    if (totalImages > maxImages) {
      alert(`You can only upload up to ${maxImages} images. You currently have ${images.length} images and are trying to add ${fileArray.length} more.`);
      return;
    }

    setUploading(true);

    // Create previews for immediate feedback
    const newPreviews: ImagePreview[] = fileArray.map(file => ({
      url: createImagePreview(file),
      file,
      uploading: true,
    }));

    setPreviews(prev => [...prev, ...newPreviews]);

    // Upload files to Cloudinary
    const uploadPromises = fileArray.map(async (file, index) => {
      try {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Upload to server
        const result = await uploadImageToServer(file);
        
        if (!result.success || !result.imageUrl) {
          throw new Error(result.error || "Upload failed");
        }

        // Clean up preview URL
        revokeImagePreview(newPreviews[index].url);

        return {
          url: result.imageUrl,
          uploading: false,
        };
      } catch (error) {
        console.error("Upload error:", error);
        return {
          url: newPreviews[index].url,
          uploading: false,
          error: error instanceof Error ? error.message : "Upload failed",
        };
      }
    });

    try {
      const uploadResults = await Promise.all(uploadPromises);
      
      // Update previews with results
      setPreviews(prev => {
        const updated = [...prev];
        fileArray.forEach((_, index) => {
          const resultIndex = prev.length - fileArray.length + index;
          updated[resultIndex] = uploadResults[index];
        });
        return updated;
      });

      // Add successful uploads to images array
      const successfulUploads = uploadResults
        .filter(result => !result.error && !result.uploading)
        .map(result => result.url);

      if (successfulUploads.length > 0) {
        onImagesChange([...images, ...successfulUploads]);
      }

      // Clean up failed uploads after a delay
      setTimeout(() => {
        setPreviews(prev => prev.filter(preview => !preview.error));
      }, 5000);

    } catch (error) {
      console.error("Batch upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    onImagesChange(newImages);
  };

  const handleRemovePreview = (indexToRemove: number) => {
    setPreviews(prev => {
      const preview = prev[indexToRemove];
      if (preview.file) {
        revokeImagePreview(preview.url);
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const allImages = [...images.map(url => ({ url, uploading: false })), ...previews];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Property Images</h3>
          <p className="text-xs text-gray-500">
            Upload up to {maxImages} images (JPEG, PNG, WebP, max 10MB each)
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {images.length}/{maxImages}
        </Badge>
      </div>

      {/* Upload Button */}
      <div className="flex items-center space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={openFileDialog}
          disabled={disabled || uploading || images.length >= maxImages}
          className="flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? "Uploading..." : "Select Images"}</span>
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span>Uploading images...</span>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allImages.map((image, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                  {image.uploading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                        <p className="text-xs text-gray-500">Uploading...</p>
                      </div>
                    </div>
                  ) : image.error ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-xs text-red-500">Failed</p>
                        <p className="text-xs text-gray-500 mt-1">{image.error}</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={image.url}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Remove Button */}
                  {!image.uploading && !image.error && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        if (index < images.length) {
                          handleRemoveImage(index);
                        } else {
                          handleRemovePreview(index - images.length);
                        }
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {allImages.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No images uploaded
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Upload property images to showcase your listing
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={openFileDialog}
              disabled={disabled || uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Images
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}