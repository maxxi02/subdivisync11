// app/api/property-inquiries/route.ts
import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId } from "mongodb";
export interface CreatePropertyInquiryRequest {
  fullName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  currentAddress: string;
  preferredContactMethod: "phone" | "email" | "text";
  preferredContactTime: string;
  selectedPropertyId?: string;
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
}

export interface PropertyInquiry {
  _id: string;
  fullName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  currentAddress: string;
  preferredContactMethod: string;
  preferredContactTime: string;
  selectedPropertyId?: string;
  specificLotUnit?: string;
  propertyType: string;
  budgetRange: string;
  preferredLotSize?: string;
  timeline: string;
  paymentMethod: string;
  additionalRequirements?: string;
  status:
    | "new"
    | "contacted"
    | "viewing-scheduled"
    | "negotiating"
    | "closed"
    | "rejected";
  rejectionReason?: string;
  priority: "high" | "medium" | "low";
  created_by: string;
  created_at: Date;
  updated_at?: Date;
  property?: {
    title: string;
    location: string;
    price: string;
    type: string;
  };
  tenant?: {
    fullName: string;
    email: string;
    phone: string;
  };
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
    const propertiesCollection = db.collection("properties");
    const usersCollection = db.collection("users");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const propertyType = searchParams.get("propertyType");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    // Build query
    const query: Record<string, unknown> = {};

    // Non-admin users can only view their own inquiries
    if (session.user.role !== "admin") {
      query.created_by = session.user.id;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (propertyType && propertyType !== "all") {
      query.propertyType = propertyType;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch inquiries with pagination
    const inquiries = await inquiriesCollection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await inquiriesCollection.countDocuments(query);

    // Enrich inquiries with property and tenant information
    const enrichedInquiries = await Promise.all(
      inquiries.map(async (inquiry) => {
        const enriched = { ...inquiry };

        // Add property information if selectedPropertyId exists
        if (inquiry.selectedPropertyId) {
          try {
            const property = await propertiesCollection.findOne(
              { _id: new ObjectId(inquiry.selectedPropertyId) },
              {
                projection: {
                  title: 1,
                  location: 1,
                  price: 1,
                  type: 1,
                  size: 1,
                  images: 1,
                  amenities: 1,
                  description: 1,
                  bedrooms: 1,
                  bathrooms: 1,
                  sqft: 1,
                  status: 1,
                  availability_status: 1,
                },
              }
            );
            if (property) {
              enriched.property = {
                title: property.title,
                location: property.location,
                price: property.price,
                type: property.type,
              };
            }
          } catch (error) {
            console.error("Error fetching property details:", error);
          }
        }

        // Add tenant information if created_by exists (for admin view only)
        if (inquiry.created_by && session.user.role === "admin") {
          try {
            const tenant = await usersCollection.findOne(
              { _id: inquiry.created_by },
              {
                projection: {
                  name: 1,
                  firstName: 1,
                  lastName: 1,
                  email: 1,
                  phone: 1,
                },
              }
            );
            if (tenant) {
              enriched.tenant = {
                fullName:
                  tenant.name ||
                  `${tenant.firstName || ""} ${tenant.lastName || ""}`.trim(),
                email: tenant.email,
                phone: tenant.phone || inquiry.primaryPhone,
              };
            }
          } catch (error) {
            console.error("Error fetching tenant details:", error);
          }
        }

        return enriched;
      })
    );

    return NextResponse.json({
      success: true,
      inquiries: enrichedInquiries,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching property inquiries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch property inquiries" },
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

    const body: CreatePropertyInquiryRequest = await request.json();

    // Validate required fields
    const requiredFields: (keyof CreatePropertyInquiryRequest)[] = [
      "fullName",
      "primaryPhone",
      "email",
      "currentAddress",
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone format (basic validation for Philippine format)
    const phoneRegex = /^(\+63|0)[0-9]{10}$/;
    if (!phoneRegex.test(body.primaryPhone.replace(/\s+/g, ""))) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Validate property type if provided
    const validPropertyTypes = [
      "residential-lot",
      "commercial",
      "house-and-lot",
      "condo",
      "other",
    ];
    if (body.propertyType && !validPropertyTypes.includes(body.propertyType)) {
      return NextResponse.json(
        { success: false, error: "Invalid property type" },
        { status: 400 }
      );
    }

    // Validate contact method
    const validContactMethods = ["phone", "email", "text"];
    if (
      body.preferredContactMethod &&
      !validContactMethods.includes(body.preferredContactMethod)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid contact method" },
        { status: 400 }
      );
    }

    // Validate timeline
    const validTimelines = [
      "immediate",
      "1-3-months",
      "3-6-months",
      "6-12-months",
      "flexible",
    ];
    if (body.timeline && !validTimelines.includes(body.timeline)) {
      return NextResponse.json(
        { success: false, error: "Invalid timeline" },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = ["cash", "financing", "installment"];
    if (
      body.paymentMethod &&
      !validPaymentMethods.includes(body.paymentMethod)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Determine priority based on timeline and budget
    let priority: "high" | "medium" | "low" = "medium";

    if (body.timeline === "immediate" || body.paymentMethod === "cash") {
      priority = "high";
    } else if (body.timeline === "flexible" && !body.budgetRange) {
      priority = "low";
    }

    // Create inquiry document
    const inquiryDocument = {
      fullName: body.fullName.trim(),
      primaryPhone: body.primaryPhone.trim(),
      secondaryPhone: body.secondaryPhone?.trim() || "",
      email: body.email.trim().toLowerCase(),
      currentAddress: body.currentAddress.trim(),
      preferredContactMethod: body.preferredContactMethod || "email",
      preferredContactTime: body.preferredContactTime?.trim() || "",
      selectedPropertyId: body.selectedPropertyId || null,
      specificLotUnit: body.specificLotUnit?.trim() || "",
      propertyType: body.propertyType || "residential-lot",
      budgetRange: body.budgetRange?.trim() || "",
      preferredLotSize: body.preferredLotSize?.trim() || "",
      timeline: body.timeline || "flexible",
      paymentMethod: body.paymentMethod || "financing",
      additionalRequirements: body.additionalRequirements?.trim() || "",
      status: "new" as const,
      priority,
      created_by: session.user.id,
      created_at: new Date(),
    };

    const result = await inquiriesCollection.insertOne(inquiryDocument);

    if (!result.insertedId) {
      return NextResponse.json(
        { success: false, error: "Failed to create property inquiry" },
        { status: 500 }
      );
    }

    // Fetch the created inquiry
    const createdInquiry = await inquiriesCollection.findOne({
      _id: result.insertedId,
    });

    return NextResponse.json(
      {
        success: true,
        inquiry: createdInquiry,
        message:
          "Property inquiry submitted successfully! We'll contact you soon.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating property inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create property inquiry" },
      { status: 500 }
    );
  }
}
