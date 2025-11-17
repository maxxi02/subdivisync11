// src/app/api/properties/route.ts
import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId, Collection } from "mongodb";

export interface CreatePropertyRequest {
  title: string;
  location: string;
  size: string;
  price: string;
  type: "single-attached" | "duplex" | "two-storey-house"; // Match frontend
  status: "CREATED" | "UNDER_INQUIRY" | "APPROVED" | "REJECTED" | "LEASED";
  features?: string[];
  images?: string[];
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
  type: "single-attached" | "duplex" | "two-storey-house"; // Match frontend
  status: "CREATED" | "UNDER_INQUIRY" | "APPROVED" | "REJECTED" | "LEASED";
  images?: string[];
  features: string[];
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
  inquiries?: Inquiry[];
}

export interface Inquiry {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

interface DBProperty {
  _id?: ObjectId;
  title: string;
  location: string;
  size: string;
  price: string;
  type: "single-attached" | "duplex" | "two-storey-house"; // Match frontend
  status: "CREATED" | "UNDER_INQUIRY" | "APPROVED" | "REJECTED" | "LEASED";
  images?: string[];
  features: string[];
  description?: string;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
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
  inquiries?: Inquiry[];
}

// GET - Fetch all properties
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const propertiesCollection: Collection<DBProperty> =
      db.collection("properties");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const statusParam = searchParams.get("status");
    const typeParam = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const publicAccess = searchParams.get("public") === "true";
    const myInquiries = searchParams.get("myInquiries") === "true";

    // Fetch a single property by ID (public access allowed)
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

      const enrichedProperty: Property = {
        ...property,
        _id: property._id!.toString(),
        price: parseFloat(property.price),
        features: property.features || [], // Changed from amenities
        images: property.images || [],
        inquiries: property.inquiries || [],
        created_at: property.created_at,
        updated_at: property.updated_at,
      };

      return NextResponse.json({
        success: true,
        property: enrichedProperty,
      });
    }

    // For public access, only show CREATED properties without authentication
    if (publicAccess) {
      const query = { status: "CREATED" } as const;
      const skip = (page - 1) * limit;

      const properties = await propertiesCollection
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const totalCount = await propertiesCollection.countDocuments(query);

      const enrichedProperties = properties.map(
        (property): Property => ({
          ...property,
          _id: property._id!.toString(),
          price: parseFloat(property.price),
          features: property.features || [], // Changed from amenities
          images: property.images || [],
          inquiries: property.inquiries || [],
          created_at: property.created_at,
          updated_at: property.updated_at,
        })
      );

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
    }

    // Regular authenticated access
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const validStatuses = [
      "CREATED",
      "UNDER_INQUIRY",
      "APPROVED",
      "REJECTED",
      "LEASED",
    ] as const;
    type Status = (typeof validStatuses)[number];
    const validTypes = [
      "single-attached",
      "duplex",
      "two-storey-house",
    ] as const;
    type PropertyType = (typeof validTypes)[number];

    const query: Record<string, unknown> = {};

    if (myInquiries) {
      if (session.user.role === "tenant") {
        query["inquiries.email"] = session.user.email;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "myInquiries parameter is only for tenants",
          },
          { status: 403 }
        );
      }
    } else {
      // Modified logic to handle different user roles
      if (session.user.role === "admin") {
        // Admin can see all properties
        if (
          statusParam &&
          statusParam !== "all" &&
          validStatuses.includes(statusParam as Status)
        ) {
          query.status = statusParam as Status;
        }
      } else if (session.user.role === "tenant") {
        // Tenants can see all CREATED properties (available for inquiry)
        query.status = "CREATED" as const;
      } else {
        // Property owners/creators can only see their own properties
        query.created_by = session.user.id;
        if (
          statusParam &&
          statusParam !== "all" &&
          validStatuses.includes(statusParam as Status)
        ) {
          query.status = statusParam as Status;
        }
      }
    }

    if (
      typeParam &&
      typeParam !== "all" &&
      validTypes.includes(typeParam as PropertyType)
    ) {
      query.type = typeParam as PropertyType;
    }

    const skip = (page - 1) * limit;

    const properties = await propertiesCollection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalCount = await propertiesCollection.countDocuments(query);
    const enrichedProperties = properties.map(
      (property): Property => ({
        ...property,
        _id: property._id!.toString(),
        price: parseFloat(property.price),
        features: property.features || [], // Changed from amenities
        images: property.images || [],
        inquiries: property.inquiries || [],
        created_at: property.created_at,
        updated_at: property.updated_at,
      })
    );

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
    const propertiesCollection: Collection<DBProperty> =
      db.collection("properties");

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
      "single-attached",
      "duplex",
      "two-storey-house",
    ] as const;
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
    ] as const;
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
    const propertyDocument: DBProperty = {
      title: body.title.trim(),
      location: body.location.trim(),
      size: body.size.trim(),
      price: body.price.trim(),
      type: body.type,
      status: body.status,
      images: Array.isArray(body.images) ? body.images : [],
      features: Array.isArray(body.features) ? body.features : [],
      description: body.description?.trim() || "",
      sqft: body.sqft || 0,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      inquiries: [],
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

    const enrichedProperty: Property = {
      ...createdProperty!,
      _id: createdProperty!._id!.toString(),
      price: parseFloat(createdProperty!.price),
      features: createdProperty!.features || [],
      images: createdProperty!.images || [],
      inquiries: createdProperty!.inquiries || [],
      created_at: createdProperty!.created_at,
      updated_at: createdProperty!.updated_at,
    };
    return NextResponse.json(
      {
        success: true,
        property: enrichedProperty,
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
    const propertiesCollection: Collection<DBProperty> =
      db.collection("properties");

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
      "single-attached",
      "duplex",
      "two-storey-house",
    ] as const;
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
    ] as const;
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
    const updateDocument: Partial<DBProperty> = {
      title: body.title.trim(),
      location: body.location.trim(),
      size: body.size.trim(),
      price: body.price.trim(),
      type: body.type,
      status: body.status,
      images: Array.isArray(body.images) ? body.images : [],
      features: Array.isArray(body.features) ? body.features : [], // Changed from amenities
      description: body.description?.trim() || "",
      sqft: body.sqft || 0,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
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
    const enrichedProperty: Property = {
      ...updatedProperty!,
      _id: updatedProperty!._id!.toString(),
      price: parseFloat(updatedProperty!.price),
      features: updatedProperty!.features || [], // Changed from amenities
      images: updatedProperty!.images || [],
      inquiries: updatedProperty!.inquiries || [],
      created_at: updatedProperty!.created_at,
      updated_at: updatedProperty!.updated_at,
      bedrooms: updatedProperty!.bedrooms,
      bathrooms: updatedProperty!.bathrooms,
    };
    return NextResponse.json(
      {
        success: true,
        property: enrichedProperty,
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
    const propertiesCollection: Collection<DBProperty> =
      db.collection("properties");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Property ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
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

    // Check for pending inquiries
    const pendingInquiries =
      existingProperty.inquiries?.filter(
        (inq: Inquiry) => inq.status === "pending"
      ) || [];

    if (pendingInquiries.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete property with pending inquiries",
        },
        { status: 400 }
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
