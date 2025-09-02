// src/lib/upload.ts

export interface UploadResponse {
  success: boolean;
  imageUrl?: string;
  publicId?: string;
  error?: string;
}

export const uploadImageToServer = async (
  file: File
): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Upload failed");
    }

    return result;
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
};

// Utility function to validate image files on client side
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size too large. Maximum 10MB allowed.",
    };
  }

  return { valid: true };
};

// Utility to create a preview URL for the image
export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

// Clean up preview URL to prevent memory leaks
export const revokeImagePreview = (previewUrl: string): void => {
  URL.revokeObjectURL(previewUrl);
};
