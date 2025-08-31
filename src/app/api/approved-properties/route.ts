// app/api/approved-properties/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId } from "mongodb";

// Interface definitions
interface PropertyOwner {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  approvedDate: Date;
  paymentMethod: "cash" | "financing" | "installment";
  paymentStatus: "paid" | "partial" | "pending";
}

interface ApprovedProperty {
  _id?: ObjectId;
  title: string;
  location: string;
  size: string;
  price: string;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "rented" | "sold" | "reserved";
  approvedDate: Date;
  image: string;
  owner: PropertyOwner;
  amenities: string[];
  inquiryId: string; // Reference to the original inquiry
  createdAt: Date;
  updatedAt: Date;
}

// GET - Fetch approved properties (Admin only)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const query: Record<string, unknown> = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (type && type !== "all") {
      query.type = type;
    }

    const properties = await approvedPropertiesCollection
      .find(query)
      .sort({ approvedDate: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error("Error fetching approved properties:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch approved properties" },
      { status: 500 }
    );
  }
}

// POST - Create approved property from inquiry (Admin only)
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
    const approvedPropertiesCollection = db.collection("approved_properties");
    const inquiriesCollection = db.collection("property_inquiries");

    const body = await request.json();
    const {
      inquiryId,
      title,
      location,
      size,
      price,
      type,
      status,
      image,
      amenities = [],
    } = body;

    // Validate required fields
    if (!inquiryId || !title || !location || !price || !type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the inquiry details
    const inquiry = await inquiriesCollection.findOne({
      _id: new ObjectId(inquiryId),
    });

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    const owner: PropertyOwner = {
      id: inquiry.createdBy,
      fullName: inquiry.fullName,
      email: inquiry.email,
      phone: inquiry.primaryPhone,
      address: inquiry.currentAddress,
      approvedDate: new Date(),
      paymentMethod: inquiry.paymentMethod,
      paymentStatus: "pending",
    };

    const approvedProperty: Omit<ApprovedProperty, "_id"> = {
      title,
      location,
      size,
      price,
      type,
      status: status || "reserved",
      approvedDate: new Date(),
      image: image || "/placeholder.svg",
      owner,
      amenities,
      inquiryId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await approvedPropertiesCollection.insertOne(
      approvedProperty
    );

    // Update the inquiry status to approved
    await inquiriesCollection.updateOne(
      { _id: new ObjectId(inquiryId) },
      {
        $set: {
          status: "approved",
          updatedAt: new Date(),
        },
      }
    );

    const createdProperty = await approvedPropertiesCollection.findOne({
      _id: result.insertedId,
    });

    return NextResponse.json(
      {
        success: true,
        property: createdProperty,
        message: "Property approved and created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating approved property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create approved property" },
      { status: 500 }
    );
  }
}
