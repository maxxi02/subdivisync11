// app/api/property-inquiries/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId } from "mongodb";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Fetch specific inquiry
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const inquiriesCollection = db.collection("property_inquiries");

    const inquiry = await inquiriesCollection.findOne({
      _id: new ObjectId(params.id),
    });

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    // Non-admin users can only access their own inquiries
    if (
      session.user.role !== "admin" &&
      inquiry.createdBy !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      inquiry,
    });
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inquiry" },
      { status: 500 }
    );
  }
}

// PUT - Update inquiry status (Admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectDB();
    const inquiriesCollection = db.collection("property_inquiries");

    const body = await request.json();
    const { status, priority, adminNotes } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const result = await inquiriesCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    const updatedInquiry = await inquiriesCollection.findOne({
      _id: new ObjectId(params.id),
    });

    return NextResponse.json({
      success: true,
      inquiry: updatedInquiry,
      message: `Inquiry ${status} successfully`,
    });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}

// DELETE - Delete inquiry (Admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectDB();
    const inquiriesCollection = db.collection("property_inquiries");

    const result = await inquiriesCollection.deleteOne({
      _id: new ObjectId(params.id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete inquiry" },
      { status: 500 }
    );
  }
}
