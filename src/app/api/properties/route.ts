// app/api/properties/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";

// GET - Fetch all properties
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
    const propertiesCollection = db.collection("properties");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const query: {
      availability_status?: string;
      type?: string;
      rent_amount?: {
        $gte?: number;
        $lte?: number;
      };
    } = {};

    // Non-admin users can only see available properties
    if (session.user.role !== "admin") {
      query.availability_status = "Available";
    }

    // Apply filters for admin users
    if (status && status !== "all" && session.user.role === "admin") {
      query.availability_status = status;
    }

    if (minPrice || maxPrice) {
      query.rent_amount = {};
      if (minPrice) query.rent_amount.$gte = Number(minPrice);
      if (maxPrice) query.rent_amount.$lte = Number(maxPrice);
    }

    const properties = await propertiesCollection
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// POST - Create new property (Admin only)
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
    const propertiesCollection = db.collection("properties");

    const body = await request.json();
    const {
      address,
      rent_amount,
      description,
      photos = [],
      availability_status = "Available",
      bedrooms,
      bathrooms,
      sqft,
      type,
      amenities = [],
    } = body;

    // Validate required fields
    if (!address || !rent_amount || !bedrooms || !bathrooms || !sqft || !type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const property = {
      address,
      rent_amount: Number(rent_amount),
      description,
      photos,
      availability_status,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      sqft: Number(sqft),
      type,
      amenities,
      created_by: session.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await propertiesCollection.insertOne(property);
    const createdProperty = await propertiesCollection.findOne({
      _id: result.insertedId,
    });

    return NextResponse.json(
      {
        success: true,
        property: createdProperty,
        message: "Property created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create property" },
      { status: 500 }
    );
  }
}
