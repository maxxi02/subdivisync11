// app/api/properties/route.ts
import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";

export interface CreatePropertyRequest {
  title: string;
  location: string;
  size: string;
  price: string;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "available" | "reserved" | "sold" | "rented";
  image: string;
  amenities: string[];
  description: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
}

export interface Property {
  _id: string;
  title: string;
  location: string;
  size: string;
  price: string;
  type: string;
  status: string;
  image: string;
  amenities: string[];
  description: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  availability_status: string;
  created_by: string;
  created_at: Date;
  updated_at?: Date;
  owner?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    paymentStatus: string;
    paymentMethod?: string;
  };
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
    const usersCollection = db.collection("users");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    // Build query
    const query: Record<string, unknown> = {};

    // Non-admin users can only see available properties
    if (session.user.role !== "admin") {
      query.availability_status = "Available";
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (type && type !== "all") {
      query.type = type;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch properties with pagination
    const properties = await propertiesCollection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await propertiesCollection.countDocuments(query);

    // For admin users, populate owner information
    let enrichedProperties = properties;
    if (session.user.role === "admin") {
      enrichedProperties = await Promise.all(
        properties.map(async (property) => {
          if (property.created_by) {
            const owner = await usersCollection.findOne(
              { _id: property.created_by },
              { projection: { password: 0 } }
            );

            return {
              ...property,
              owner: owner
                ? {
                    fullName:
                      owner.name ||
                      `${owner.firstName || ""} ${owner.lastName || ""}`.trim(),
                    email: owner.email,
                    phone: owner.phone,
                    address: owner.address,
                    paymentStatus: owner.paymentStatus || "pending",
                    paymentMethod: owner.paymentMethod,
                  }
                : null,
            };
          }
          return property;
        })
      );
    }

    return NextResponse.json({
      success: true,
      properties: enrichedProperties,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
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

    const body: CreatePropertyRequest = await request.json();

    // Validate required fields
    const requiredFields: (keyof CreatePropertyRequest)[] = [
      "title",
      "location",
      "size",
      "price",
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

    // Validate property type
    const validTypes = [
      "residential-lot",
      "commercial",
      "house-and-lot",
      "condo",
    ];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid property type" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["available", "reserved", "sold", "rented"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid property status" },
        { status: 400 }
      );
    }

    // Create property document
    const propertyDocument = {
      title: body.title.trim(),
      location: body.location.trim(),
      size: body.size.trim(),
      price: body.price.trim(),
      type: body.type,
      status: body.status,
      image: body.image || "",
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      description: body.description?.trim() || "",
      bedrooms: body.bedrooms || 0,
      bathrooms: body.bathrooms || 0,
      sqft: body.sqft || 0,
      availability_status:
        body.status === "available" ? "Available" : "Not Available",
      created_by: session.user.id,
      created_at: new Date(),
    };

    const result = await propertiesCollection.insertOne(propertyDocument);

    if (!result.insertedId) {
      return NextResponse.json(
        { success: false, error: "Failed to create property" },
        { status: 500 }
      );
    }

    // Fetch the created property
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
