// app/api/property-inquiries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId } from "mongodb";

// Interface definitions
interface PropertyInquiry {
  _id?: ObjectId;
  fullName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  currentAddress: string;
  preferredContactMethod: "phone" | "email" | "text";
  preferredContactTime: string;
  specificLotUnit?: string;
  propertyType:
    | "residential-lot"
    | "commercial"
    | "house-and-lot"
    | "condo"
    | "other";
  budgetRange: string;
  preferredLotSize?: string;
  timeline:
    | "immediate"
    | "1-3-months"
    | "3-6-months"
    | "6-12-months"
    | "flexible";
  paymentMethod: "cash" | "financing" | "installment";
  additionalRequirements?: string;
  status:
    | "new"
    | "contacted"
    | "viewing-scheduled"
    | "negotiating"
    | "approved"
    | "rejected"
    | "closed";
  submittedAt: Date;
  priority: "high" | "medium" | "low";
  createdBy: string;
  updatedAt?: Date;
  adminNotes?: string;
}

// GET - Fetch property inquiries
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    let query: Record<string, unknown> = {};

    // Regular users can only see their own inquiries
    if (session.user.role !== "admin") {
      query.createdBy = session.user.id;
    }

    // Apply filters
    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    const inquiries = await inquiriesCollection
      .find(query)
      .sort({ submittedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      inquiries,
    });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

// POST - Create new property inquiry
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      fullName,
      primaryPhone,
      secondaryPhone,
      email,
      currentAddress,
      preferredContactMethod,
      preferredContactTime,
      specificLotUnit,
      propertyType,
      budgetRange,
      preferredLotSize,
      timeline,
      paymentMethod,
      additionalRequirements,
    } = body;

    // Validate required fields
    if (
      !fullName ||
      !primaryPhone ||
      !email ||
      !currentAddress ||
      !budgetRange
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const inquiry: Omit<PropertyInquiry, "_id"> = {
      fullName,
      primaryPhone,
      secondaryPhone,
      email,
      currentAddress,
      preferredContactMethod: preferredContactMethod || "email",
      preferredContactTime: preferredContactTime || "",
      specificLotUnit,
      propertyType: propertyType || "residential-lot",
      budgetRange,
      preferredLotSize,
      timeline: timeline || "flexible",
      paymentMethod: paymentMethod || "financing",
      additionalRequirements,
      status: "new",
      submittedAt: new Date(),
      priority: "medium",
      createdBy: session.user.id,
      updatedAt: new Date(),
    };

    const result = await inquiriesCollection.insertOne(inquiry);
    const createdInquiry = await inquiriesCollection.findOne({
      _id: result.insertedId,
    });

    return NextResponse.json(
      {
        success: true,
        inquiry: createdInquiry,
        message: "Property inquiry submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}
