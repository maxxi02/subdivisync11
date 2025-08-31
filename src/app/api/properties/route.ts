// app/api/properties/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";

// Interface definitions
interface Property {
  _id?: string;
  title: string;
  location: string;
  size: string;
  price: string;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "available" | "reserved" | "sold" | "rented";
  image: string;
  amenities: string[];
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
  availability_status?: string;
}

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
    const type = searchParams.get("type");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const query: Record<string, unknown> = {};

    // Non-admin users can only see available properties
    if (session.user.role !== "admin") {
      query.availability_status = "Available";
    }

    // Apply filters for admin users
    if (status && status !== "all" && session.user.role === "admin") {
      query.availability_status = status;
    }

    if (type && type !== "all") {
      query.type = type;
    }

    if (minPrice || maxPrice) {
      const priceQuery: Record<string, number> = {};
      if (minPrice) priceQuery.$gte = Number(minPrice);
      if (maxPrice) priceQuery.$lte = Number(maxPrice);
      query.rent_amount = priceQuery;
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
      title,
      location,
      size,
      price,
      type,
      status = "available",
      image = "/placeholder.svg",
      amenities = [],
      description,
      bedrooms,
      bathrooms,
      sqft,
    } = body;

    // Validate required fields
    if (!title || !location || !size || !price || !type) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: title, location, size, price, and type are required",
        },
        { status: 400 }
      );
    }

    // Validate property type
    const validTypes = [
      "residential-lot",
      "commercial",
      "house-and-lot",
      "condo",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid property type" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["available", "reserved", "sold", "rented"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid property status" },
        { status: 400 }
      );
    }

    const property: Omit<Property, "_id"> = {
      title,
      location,
      size,
      price,
      type,
      status,
      image,
      amenities: Array.isArray(amenities) ? amenities : [],
      description,
      bedrooms: bedrooms ? Number(bedrooms) : 0, // Changed from undefined to 0
      bathrooms: bathrooms ? Number(bathrooms) : 0, // Changed from undefined to 0
      sqft: sqft ? Number(sqft) : 0, // Changed from undefined to 0
      created_by: session.user.id,
      created_at: new Date(),
      updated_at: new Date(),
      availability_status:
        status === "available" ? "Available" : "Not Available",
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
