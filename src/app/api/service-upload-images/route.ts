// src/app/api/service-upload-images/route.ts
import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const images = formData.getAll("images") as File[];

    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, error: "No images provided" },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    for (const image of images) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, error: "All files must be images" },
          { status: 400 }
        );
      }

      // Check file size (5MB limit)
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "Image size must be less than 5MB" },
          { status: 400 }
        );
      }
    }

    const uploadedImageUrls: string[] = [];

    // Upload each image to Cloudinary
    for (const imageFile of images) {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Convert buffer to base64
        const base64Image = buffer.toString("base64");
        const dataURI = `data:${imageFile.type};base64,${base64Image}`;

        // Upload to Cloudinary
        const result = (await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            dataURI,
            {
              folder: "service-requests",
              resource_type: "image",
              transformation: [
                { width: 1200, height: 800, crop: "limit" }, // Resize for optimal display
                { quality: "auto" }, // Optimize quality
                { format: "webp" }, // Convert to webp for better performance
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url: string });
            }
          );
        })) as { secure_url: string };

        if (result && result.secure_url) {
          uploadedImageUrls.push(result.secure_url);
        } else {
          throw new Error("Failed to upload image to Cloudinary");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to upload image: ${imageFile.name}`,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      imageUrls: uploadedImageUrls,
      message: `Successfully uploaded ${uploadedImageUrls.length} image(s)`,
    });
  } catch (error) {
    console.error("Error in image upload:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload images" },
      { status: 500 }
    );
  }
}

// Optional: DELETE endpoint to remove images from Cloudinary
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Extract public ID from Cloudinary URL
    const urlParts = imageUrl.split("/");
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split(".")[0]; // Remove file extension
    const fullPublicId = `service-requests/${publicId}`;

    // Delete from Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(fullPublicId, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
