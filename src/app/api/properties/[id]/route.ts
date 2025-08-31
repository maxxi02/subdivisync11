// app/api/properties/[id]/route.ts
import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB, db } from "@/database/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const propertiesCollection = db.collection("properties");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
        { status: 400 }
      );
    }

    const query: { _id: ObjectId; availability_status?: string } = {
      _id: new ObjectId(id),
    };

    // Non-admin users can only view available properties
    if (session.user.role !== "admin") {
      query.availability_status = "Available";
    }

    const property = await propertiesCollection.findOne(query);

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found or not available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      property,
    });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

// PUT - Update property (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectDB();
    const propertiesCollection = db.collection("properties");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData = {
      ...body,
      updated_at: new Date(),
    };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.created_at;
    delete updateData.created_by;

    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      property,
      message: "Property updated successfully",
    });
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// DELETE - Delete property (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectDB();
    const propertiesCollection = db.collection("properties");
    const appointmentsCollection = db.collection("appointments");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
        { status: 400 }
      );
    }

    // Check if property has pending appointments
    const pendingAppointments = await appointmentsCollection.countDocuments({
      property_id: id,
      status: { $in: ["pending", "confirmed"] },
    });

    if (pendingAppointments > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete property with pending appointments",
        },
        { status: 400 }
      );
    }

    const result = await propertiesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    // Clean up related appointments
    await appointmentsCollection.deleteMany({
      property_id: id,
    });

    return NextResponse.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
