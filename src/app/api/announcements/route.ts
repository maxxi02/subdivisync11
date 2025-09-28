import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/better-auth/action";
import { v2 as cloudinary } from "cloudinary";
import { connectDB, db } from "@/database/mongodb";
import { Collection, ObjectId } from "mongodb";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  category: string;
  priority: "low" | "medium" | "high";
  scheduledDate: string;
  images?: { url: string; publicId: string }[];
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: "low" | "medium" | "high";
  scheduledDate: Date;
  images: { url: string; publicId: string }[];
  created_by: string;
  created_at: Date;
  updated_at?: Date;
}

interface DBAnnouncement {
  _id?: ObjectId;
  title: string;
  content: string;
  category: string;
  priority: "low" | "medium" | "high";
  scheduledDate: Date;
  images: { url: string; publicId: string }[];
  created_by: string;
  created_at: Date;
  updated_at?: Date;
}

// POST - Create new announcement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectDB();
    const announcementsCollection: Collection<DBAnnouncement> =
      db.collection("announcements");

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;
    const priority = formData.get("priority") as string;
    const scheduledDate = formData.get("scheduledDate") as string;
    const images = formData.getAll("images") as File[];

    // Validate required fields
    const requiredFields: (keyof CreateAnnouncementRequest)[] = [
      "title",
      "content",
      "category",
      "priority",
      "scheduledDate",
    ];
    if (!title || !content || !category || !priority || !scheduledDate) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${requiredFields
            .filter((field) => !formData.get(field))
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ["low", "medium", "high"] as const;
    if (!validPriorities.includes(priority as "low" | "medium" | "high")) {
      return NextResponse.json(
        { success: false, error: "Invalid priority value" },
        { status: 400 }
      );
    }

    // Validate scheduledDate
    const parsedDate = new Date(scheduledDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid scheduled date format" },
        { status: 400 }
      );
    }

    // Validate and upload images
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const uploadedImages: { url: string; publicId: string }[] = [];

    for (const image of images) {
      if (!allowedTypes.includes(image.type)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid file type. Please upload an image.",
          },
          { status: 400 }
        );
      }
      if (image.size > maxSize) {
        return NextResponse.json(
          {
            success: false,
            error: "File size too large. Maximum 10MB allowed.",
          },
          { status: 400 }
        );
      }

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "image",
              folder: "announcements",
              transformation: [
                { width: 1200, height: 800, crop: "limit" },
                { quality: "auto", fetch_format: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url: string; public_id: string });
            }
          )
          .end(buffer);
      });

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    // Create announcement document
    const announcementDocument: DBAnnouncement = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      priority: priority as "low" | "medium" | "high",
      scheduledDate: parsedDate,
      images: uploadedImages,
      created_by: session.user.id,
      created_at: new Date(),
    };

    const result = await announcementsCollection.insertOne(
      announcementDocument
    );

    if (!result.insertedId) {
      return NextResponse.json(
        { success: false, error: "Failed to create announcement" },
        { status: 500 }
      );
    }

    // Fetch the created announcement
    const createdAnnouncement = await announcementsCollection.findOne({
      _id: result.insertedId,
    });

    const enrichedAnnouncement: Announcement = {
      ...createdAnnouncement!,
      _id: createdAnnouncement!._id!.toString(),
      images: createdAnnouncement!.images || [],
      created_at: createdAnnouncement!.created_at,
      updated_at: createdAnnouncement!.updated_at,
    };

    return NextResponse.json(
      {
        success: true,
        announcement: enrichedAnnouncement,
        message: "Announcement created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

// GET - Fetch announcements (Public access by default)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const announcementsCollection: Collection<DBAnnouncement> =
      db.collection("announcements");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    // Fetch a single announcement by ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, error: "Invalid announcement ID" },
          { status: 400 }
        );
      }

      const announcement = await announcementsCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!announcement) {
        return NextResponse.json(
          { success: false, error: "Announcement not found" },
          { status: 404 }
        );
      }

      const enrichedAnnouncement: Announcement = {
        ...announcement,
        _id: announcement._id!.toString(),
        images: announcement.images || [],
        created_at: announcement.created_at,
        updated_at: announcement.updated_at,
      };

      return NextResponse.json({
        success: true,
        announcement: enrichedAnnouncement,
      });
    }

    // Fetch all announcements (publicly accessible)
    const skip = (page - 1) * limit;
    const announcements = await announcementsCollection
      .find({})
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalCount = await announcementsCollection.countDocuments({});

    const enrichedAnnouncements = announcements.map(
      (announcement): Announcement => ({
        ...announcement,
        _id: announcement._id!.toString(),
        images: announcement.images || [],
        created_at: announcement.created_at,
        updated_at: announcement.updated_at,
      })
    );

    return NextResponse.json({
      success: true,
      announcements: enrichedAnnouncements,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// PUT - Update existing announcement (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectDB();
    const announcementsCollection: Collection<DBAnnouncement> =
      db.collection("announcements");

    const formData = await request.formData();
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;
    const priority = formData.get("priority") as string;
    const scheduledDate = formData.get("scheduledDate") as string;
    const images = formData.getAll("images") as File[];
    const imagesToDelete = JSON.parse(
      (formData.get("imagesToDelete") as string) || "[]"
    ) as string[];

    // Validate required fields
    const requiredFields: (keyof CreateAnnouncementRequest)[] = [
      "title",
      "content",
      "category",
      "priority",
      "scheduledDate",
    ];
    if (!id || !title || !content || !category || !priority || !scheduledDate) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${(
            requiredFields.filter((field) => !formData.get(field)) as string[]
          )
            .concat(!id ? ["id"] : [])
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ["low", "medium", "high"] as const;
    if (!validPriorities.includes(priority as "low" | "medium" | "high")) {
      return NextResponse.json(
        { success: false, error: "Invalid priority value" },
        { status: 400 }
      );
    }

    // Validate scheduledDate
    const parsedDate = new Date(scheduledDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid scheduled date format" },
        { status: 400 }
      );
    }

    // Check if announcement exists
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid announcement ID" },
        { status: 400 }
      );
    }

    const existingAnnouncement = await announcementsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Delete specified images from Cloudinary
    for (const publicId of imagesToDelete) {
      await cloudinary.uploader.destroy(publicId);
    }

    // Upload new images
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const uploadedImages: { url: string; publicId: string }[] = [
      ...(existingAnnouncement.images || []).filter(
        (img) => !imagesToDelete.includes(img.publicId)
      ),
    ];

    for (const image of images) {
      if (!allowedTypes.includes(image.type)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid file type. Please upload an image.",
          },
          { status: 400 }
        );
      }
      if (image.size > maxSize) {
        return NextResponse.json(
          {
            success: false,
            error: "File size too large. Maximum 10MB allowed.",
          },
          { status: 400 }
        );
      }

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "image",
              folder: "announcements",
              transformation: [
                { width: 1200, height: 800, crop: "limit" },
                { quality: "auto", fetch_format: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url: string; public_id: string });
            }
          )
          .end(buffer);
      });

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    // Update announcement document
    const updateDocument: Partial<DBAnnouncement> = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      priority: priority as "low" | "medium" | "high",
      scheduledDate: parsedDate,
      images: uploadedImages,
      updated_at: new Date(),
    };

    const result = await announcementsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDocument }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update announcement" },
        { status: 500 }
      );
    }

    // Fetch the updated announcement
    const updatedAnnouncement = await announcementsCollection.findOne({
      _id: new ObjectId(id),
    });

    const enrichedAnnouncement: Announcement = {
      ...updatedAnnouncement!,
      _id: updatedAnnouncement!._id!.toString(),
      images: updatedAnnouncement!.images || [],
      created_at: updatedAnnouncement!.created_at,
      updated_at: updatedAnnouncement!.updated_at,
    };

    return NextResponse.json(
      {
        success: true,
        announcement: enrichedAnnouncement,
        message: "Announcement updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an announcement (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectDB();
    const announcementsCollection: Collection<DBAnnouncement> =
      db.collection("announcements");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Announcement ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid announcement ID" },
        { status: 400 }
      );
    }

    // Check if announcement exists
    const existingAnnouncement = await announcementsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Delete images from Cloudinary
    for (const image of existingAnnouncement.images || []) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    const result = await announcementsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to delete announcement" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Announcement deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
