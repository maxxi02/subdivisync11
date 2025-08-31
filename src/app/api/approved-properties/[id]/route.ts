// app/api/approved-properties/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId } from "mongodb";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Fetch specific approved property
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectDB();
    const approvedPropertiesCollection = db.collection("approved_properties");

    const property = await approvedPropertiesCollection.findOne({
      _id: new ObjectId(params.id),
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      property,
    });
  } catch (error) {
    console.error("Error fetching approved property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

// PUT - Update approved property
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
    const approvedPropertiesCollection = db.collection("approved_properties");

    const body = await request.json();
    const { status, paymentStatus, title, price, location } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (title) updateData.title = title;
    if (price) updateData.price = price;
    if (location) updateData.location = location;
    if (paymentStatus) updateData["owner.paymentStatus"] = paymentStatus;

    const result = await approvedPropertiesCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    const updatedProperty = await approvedPropertiesCollection.findOne({
      _id: new ObjectId(params.id),
    });

    return NextResponse.json({
      success: true,
      property: updatedProperty,
      message: "Property updated successfully",
    });
  } catch (error) {
    console.error("Error updating approved property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// DELETE - Delete approved property
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
    const approvedPropertiesCollection = db.collection("approved_properties");

    const result = await approvedPropertiesCollection.deleteOne({
      _id: new ObjectId(params.id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting approved property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
