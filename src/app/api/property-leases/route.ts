// app/api/property-leases/route.ts
import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId } from "mongodb";

export interface CreatePropertyLeaseRequest {
  inquiryId: string;
  propertyId: string;
  leasePlan: {
    id: string;
    name: string;
    duration: number; 
    monthlyRate: number;
    totalAmount: number;
    interestRate: number;
    features: string[];
    recommended?: boolean;
  };
  propertyDetails: {
    title: string;
    location: string;
    price: string;
    type: string;
    size?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    amenities?: string[];
    description?: string;
  };
  ownerDetails: {
    fullName: string;
    email: string;
    primaryPhone: string;
    secondaryPhone?: string;
    currentAddress: string;
    userId: string; // Reference to the user who made the inquiry
  };
  leaseTerms: {
    startDate: Date;
    endDate: Date;
    securityDeposit?: number;
    paymentDueDate: number; // day of month (1-31)
    lateFeeAmount?: number;
    gracePeriodDays?: number;
  };
}

export interface PropertyLease {
  _id: string;
  inquiryId: string;
  propertyId: string;
  leasePlan: {
    id: string;
    name: string;
    duration: number;
    monthlyRate: number;
    totalAmount: number;
    interestRate: number;
    features: string[];
    recommended?: boolean;
  };
  propertyDetails: {
    title: string;
    location: string;
    price: string;
    type: string;
    size?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    amenities?: string[];
    description?: string;
  };
  ownerDetails: {
    fullName: string;
    email: string;
    primaryPhone: string;
    secondaryPhone?: string;
    currentAddress: string;
    userId: string;
  };
  leaseTerms: {
    startDate: Date;
    endDate: Date;
    securityDeposit?: number;
    paymentDueDate: number;
    lateFeeAmount?: number;
    gracePeriodDays?: number;
  };
  status: "active" | "completed" | "terminated" | "pending";
  paymentHistory: Array<{
    month: number;
    year: number;
    amount: number;
    paidDate?: Date;
    status: "pending" | "paid" | "overdue";
    lateFee?: number;
  }>;
  created_by: string; // Admin who approved the lease
  created_at: Date;
  updated_at?: Date;
}

// GET - Fetch property leases
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
    const leasesCollection = db.collection("property_leases");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const propertyId = searchParams.get("propertyId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    // Build query
    const query: Record<string, unknown> = {};

    // Non-admin users can only view their own leases
    if (session.user.role !== "admin") {
      query["ownerDetails.userId"] = session.user.id;
    } else if (userId) {
      query["ownerDetails.userId"] = userId;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (propertyId) {
      query.propertyId = propertyId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch leases with pagination
    const leases = await leasesCollection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await leasesCollection.countDocuments(query);

    return NextResponse.json({
      success: true,
      leases,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching property leases:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch property leases" },
      { status: 500 }
    );
  }
}

// POST - Create new property lease
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
    const leasesCollection = db.collection("property_leases");
    const inquiriesCollection = db.collection("property_inquiries");
    const propertiesCollection = db.collection("properties");

    const body: CreatePropertyLeaseRequest = await request.json();

    // Validate required fields
    const requiredFields: (keyof CreatePropertyLeaseRequest)[] = [
      "inquiryId",
      "propertyId",
      "leasePlan",
      "propertyDetails",
      "ownerDetails",
      "leaseTerms",
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

    // Validate that the inquiry and property exist
    const inquiry = await inquiriesCollection.findOne({
      _id: new ObjectId(body.inquiryId),
    });

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(body.propertyId),
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    // Check if a lease already exists for this inquiry
    const existingLease = await leasesCollection.findOne({
      inquiryId: body.inquiryId,
    });

    if (existingLease) {
      return NextResponse.json(
        { success: false, error: "Lease already exists for this inquiry" },
        { status: 400 }
      );
    }

    // Calculate payment schedule
    const paymentHistory = [];
    const startDate = new Date(body.leaseTerms.startDate);

    for (let i = 0; i < body.leasePlan.duration; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);

      paymentHistory.push({
        month: paymentDate.getMonth() + 1,
        year: paymentDate.getFullYear(),
        amount: body.leasePlan.monthlyRate,
        status: "pending" as const,
      });
    }

    // Create lease document
    const leaseDocument = {
      inquiryId: body.inquiryId,
      propertyId: body.propertyId,
      leasePlan: {
        id: body.leasePlan.id,
        name: body.leasePlan.name,
        duration: body.leasePlan.duration,
        monthlyRate: body.leasePlan.monthlyRate,
        totalAmount: body.leasePlan.totalAmount,
        interestRate: body.leasePlan.interestRate,
        features: body.leasePlan.features,
        recommended: body.leasePlan.recommended || false,
      },
      propertyDetails: {
        title: body.propertyDetails.title.trim(),
        location: body.propertyDetails.location.trim(),
        price: body.propertyDetails.price,
        type: body.propertyDetails.type,
        size: body.propertyDetails.size?.trim(),
        bedrooms: body.propertyDetails.bedrooms,
        bathrooms: body.propertyDetails.bathrooms,
        sqft: body.propertyDetails.sqft,
        amenities: body.propertyDetails.amenities || [],
        description: body.propertyDetails.description?.trim(),
      },
      ownerDetails: {
        fullName: body.ownerDetails.fullName.trim(),
        email: body.ownerDetails.email.trim().toLowerCase(),
        primaryPhone: body.ownerDetails.primaryPhone.trim(),
        secondaryPhone: body.ownerDetails.secondaryPhone?.trim(),
        currentAddress: body.ownerDetails.currentAddress.trim(),
        userId: body.ownerDetails.userId,
      },
      leaseTerms: {
        startDate: new Date(body.leaseTerms.startDate),
        endDate: new Date(body.leaseTerms.endDate),
        securityDeposit: body.leaseTerms.securityDeposit || 0,
        paymentDueDate: body.leaseTerms.paymentDueDate || 1,
        lateFeeAmount: body.leaseTerms.lateFeeAmount || 0,
        gracePeriodDays: body.leaseTerms.gracePeriodDays || 5,
      },
      status: "active" as const,
      paymentHistory,
      created_by: session.user.id,
      created_at: new Date(),
    };

    const result = await leasesCollection.insertOne(leaseDocument);

    if (!result.insertedId) {
      return NextResponse.json(
        { success: false, error: "Failed to create property lease" },
        { status: 500 }
      );
    }

    // Fetch the created lease
    const createdLease = await leasesCollection.findOne({
      _id: result.insertedId,
    });

    return NextResponse.json(
      {
        success: true,
        lease: createdLease,
        message: "Property lease created successfully!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating property lease:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create property lease" },
      { status: 500 }
    );
  }
}
