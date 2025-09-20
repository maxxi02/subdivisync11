import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId } from "mongodb";

export interface CreatePropertyRequest {
  title: string;
  location: string;
  size: string;
  price: string;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "CREATED" | "UNDER_INQUIRY" | "APPROVED" | "REJECTED" | "LEASED";
  images?: string[];
  amenities?: string[];
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
}

export interface Property {
  _id: string;
  title: string;
  location: string;
  size: string;
  price: number;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "CREATED" | "UNDER_INQUIRY" | "APPROVED" | "REJECTED" | "LEASED";
  images?: string[];
  amenities: string[];
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  created_by: string;
  created_at: Date;
  updated_at?: Date;
  owner?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    paymentStatus: "paid" | "partial" | "pending";
    paymentMethod?: string;
  };
}

// GET - Fetch all properties
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    // Allow public access for single property fetch, but restrict list to authenticated users
    await connectDB();
    const propertiesCollection = db.collection("properties");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    // Fetch a single property by ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, error: "Invalid property ID" },
          { status: 400 }
        );
      }

      const property = await propertiesCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!property) {
        return NextResponse.json(
          { success: false, error: "Property not found" },
          { status: 404 }
        );
      }

      // Convert ObjectId to string and ensure price is a number
      const enrichedProperty = {
        ...property,
        _id: property._id.toString(),
        price: parseFloat(property.price.toString()), // Ensure price is a number
        amenities: property.amenities || [],
        images: property.images || [],
        created_at: property.created_at.toISOString(),
        updated_at: property.updated_at
          ? property.updated_at.toISOString()
          : undefined,
      };

      return NextResponse.json({
        success: true,
        property: enrichedProperty,
      });
    }

    // Fetch multiple properties (requires authentication)
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const query: Record<string, unknown> = {};

    if (session.user.role !== "admin") {
      query.status = "CREATED";
      query.created_by = session.user.id;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (type && type !== "all") {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const properties = await propertiesCollection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalCount = await propertiesCollection.countDocuments(query);

    const enrichedProperties = properties.map((property) => ({
      ...property,
      _id: property._id.toString(),
      price: parseFloat(property.price.toString()), // Ensure price is a number
      amenities: property.amenities || [],
      images: property.images || [],
      created_at: property.created_at.toISOString(),
      updated_at: property.updated_at
        ? property.updated_at.toISOString()
        : undefined,
    }));

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
// POST - Create new property
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
    const propertiesCollection = db.collection("properties");

    const body: CreatePropertyRequest = await request.json();

    // Validate required fields
    const requiredFields: (keyof CreatePropertyRequest)[] = [
      "title",
      "location",
      "size",
      "price",
      "type",
      "status",
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
    const validStatuses = [
      "CREATED",
      "UNDER_INQUIRY",
      "APPROVED",
      "REJECTED",
      "LEASED",
    ];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid property status" },
        { status: 400 }
      );
    }

    // Validate price
    if (isNaN(parseFloat(body.price))) {
      return NextResponse.json(
        { success: false, error: "Invalid price format" },
        { status: 400 }
      );
    }

    // Create property document
    const propertyDocument: Record<string, unknown> = {
      title: body.title.trim(),
      location: body.location.trim(),
      size: body.size.trim(),
      price: body.price.trim(),
      type: body.type,
      status: body.status,
      images: Array.isArray(body.images) ? body.images : [],
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      description: body.description?.trim() || "",
      bedrooms: body.bedrooms || 0,
      bathrooms: body.bathrooms || 0,
      sqft: body.sqft || 0,
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
        property: {
          ...createdProperty,
          _id: createdProperty!._id.toString(),
          price: parseFloat(createdProperty!.price),
          amenities: createdProperty!.amenities || [],
          images: createdProperty!.images || [],
          created_at: createdProperty!.created_at,
          updated_at: createdProperty!.updated_at,
        },
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

// PUT - Update existing property (Admin or property creator only)
export async function PUT(request: NextRequest) {
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

    const body: CreatePropertyRequest & { _id: string } = await request.json();

    // Validate required fields
    const requiredFields: (keyof CreatePropertyRequest)[] = [
      "title",
      "location",
      "size",
      "price",
      "type",
      "status",
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
    const validStatuses = [
      "CREATED",
      "UNDER_INQUIRY",
      "APPROVED",
      "REJECTED",
      "LEASED",
    ];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid property status" },
        { status: 400 }
      );
    }

    // Validate price
    if (isNaN(parseFloat(body.price))) {
      return NextResponse.json(
        { success: false, error: "Invalid price format" },
        { status: 400 }
      );
    }

    // Check if property exists and user has permission
    const existingProperty = await propertiesCollection.findOne({
      _id: new ObjectId(body._id),
    });

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "admin" &&
      existingProperty.created_by !== session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No permission to update this property",
        },
        { status: 403 }
      );
    }

    // Update property document
    const updateDocument: Record<string, unknown> = {
      title: body.title.trim(),
      location: body.location.trim(),
      size: body.size.trim(),
      price: body.price.trim(),
      type: body.type,
      status: body.status,
      images: Array.isArray(body.images) ? body.images : [],
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      description: body.description?.trim() || "",
      bedrooms: body.bedrooms || 0,
      bathrooms: body.bathrooms || 0,
      sqft: body.sqft || 0,
      updated_at: new Date(),
    };

    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(body._id) },
      { $set: updateDocument }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update property" },
        { status: 500 }
      );
    }

    // Fetch the updated property
    const updatedProperty = await propertiesCollection.findOne({
      _id: new ObjectId(body._id),
    });

    return NextResponse.json(
      {
        success: true,
        property: {
          ...updatedProperty,
          _id: updatedProperty!._id.toString(),
          price: parseFloat(updatedProperty!.price),
          amenities: updatedProperty!.amenities || [],
          images: updatedProperty!.images || [],
          created_at: updatedProperty!.created_at,
          updated_at: updatedProperty!.updated_at,
        },
        message: "Property updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a property (Admin or property creator only)
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Property ID is required" },
        { status: 400 }
      );
    }

    // Check if property exists and user has permission
    const existingProperty = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "admin" &&
      existingProperty.created_by !== session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No permission to delete this property",
        },
        { status: 403 }
      );
    }

    const result = await propertiesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to delete property" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Property deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
