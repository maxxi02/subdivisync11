import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB, db } from "@/database/mongodb";

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
  inquiries?: {
    fullName: string;
    email: string;
    phone: string;
    reason: string;
    submittedAt: string;
    status: "pending" | "approved" | "rejected";
  }[];
}

// Interface for PUT request body
interface UpdatePropertyRequest extends Partial<Property> {
  owner_details?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    paymentStatus?: "paid" | "partial" | "pending";
    paymentMethod?: string;
  };
  inquiry?: {
    fullName: string;
    email: string;
    phone: string;
    reason: string;
    submittedAt: string;
    status: "pending" | "approved" | "rejected";
  };
  isInquiry?: boolean; // Flag to indicate this is an inquiry submission
}

// GET - Fetch a single property by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const propertiesCollection = db.collection("properties");
    const { id } = await params;

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
    const enrichedProperty: Property = {
      ...property,
      _id: property._id.toString(),
      price: parseFloat(property.price.toString()),
      amenities: property.amenities || [],
      images: property.images || [],
      created_at: property.created_at,
      updated_at: property.updated_at,
      created_by: property.created_by || "",
      title: property.title,
      location: property.location,
      size: property.size,
      type: property.type,
      status: property.status,
      description: property.description,
      sqft: property.sqft,
      owner: property.owner,
      inquiries: property.inquiries || [],
    };

    return NextResponse.json({
      success: true,
      property: enrichedProperty,
    });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

// PUT - Update a property OR submit an inquiry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const propertiesCollection = db.collection("properties");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
        { status: 400 }
      );
    }

    const body: UpdatePropertyRequest = await request.json();

    // Check if this is an inquiry submission
    if (body.isInquiry && body.inquiry) {
      return handleInquirySubmission(propertiesCollection, id, body.inquiry);
    }

    // Regular property update - requires authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return handlePropertyUpdate(propertiesCollection, id, body, session);
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// Handle inquiry submission (public endpoint)
async function handleInquirySubmission(
  propertiesCollection: any,
  propertyId: string,
  inquiry: any
) {
  try {
    // Validate required fields
    const requiredFields = ["fullName", "email", "phone", "reason"];
    const missingFields = requiredFields.filter((field) => !inquiry[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check if property exists and is available
    const existingProperty = await propertiesCollection.findOne({
      _id: new ObjectId(propertyId),
    });

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    if (existingProperty.status !== "CREATED") {
      return NextResponse.json(
        { success: false, error: "Property is not available for inquiry" },
        { status: 400 }
      );
    }

    // Check for existing inquiry from same email
    const existingInquiries = existingProperty.inquiries || [];
    const hasExistingInquiry = existingInquiries.some(
      (inq: any) =>
        inq.email.toLowerCase() === inquiry.email.toLowerCase() &&
        (inq.status === "pending" || inq.status === "approved")
    );

    if (hasExistingInquiry) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending inquiry for this property",
        },
        { status: 400 }
      );
    }

    // Add inquiry to property
    const newInquiry = {
      fullName: inquiry.fullName.trim(),
      email: inquiry.email.toLowerCase().trim(),
      phone: inquiry.phone.trim(),
      reason: inquiry.reason.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending" as const,
    };

    // Update property with inquiry and change status
    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(propertyId) },
      {
        $push: { inquiries: newInquiry },
        $set: {
          status: "UNDER_INQUIRY",
          updated_at: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    const updatedProperty = await propertiesCollection.findOne({
      _id: new ObjectId(propertyId),
    });

    const enrichedProperty: Property = {
      ...updatedProperty!,
      _id: updatedProperty!._id.toString(),
      price: parseFloat(updatedProperty!.price.toString()),
      amenities: updatedProperty!.amenities || [],
      images: updatedProperty!.images || [],
      created_at: updatedProperty!.created_at,
      updated_at: updatedProperty!.updated_at,
      created_by: updatedProperty!.created_by || "",
      title: updatedProperty!.title,
      location: updatedProperty!.location,
      size: updatedProperty!.size,
      type: updatedProperty!.type,
      status: updatedProperty!.status,
      description: updatedProperty!.description,
      bedrooms: updatedProperty!.bedrooms,
      bathrooms: updatedProperty!.bathrooms,
      sqft: updatedProperty!.sqft,
      owner: updatedProperty!.owner,
      inquiries: updatedProperty!.inquiries || [],
    };

    return NextResponse.json({
      success: true,
      property: enrichedProperty,
      message: "Inquiry submitted successfully",
    });
  } catch (error) {
    console.error("Error handling inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}

// Handle regular property update (authenticated endpoint)
async function handlePropertyUpdate(
  propertiesCollection: any,
  propertyId: string,
  body: UpdatePropertyRequest,
  session: any
) {
  try {
    // Validate required fields for property update
    const requiredFields: (keyof Property)[] = [
      "title",
      "location",
      "size",
      "price",
      "type",
      "status",
    ];
    const missingFields = requiredFields.filter(
      (field) => body[field] === undefined
    );

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
    if (!validTypes.includes(body.type!)) {
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
    if (!validStatuses.includes(body.status!)) {
      return NextResponse.json(
        { success: false, error: "Invalid property status" },
        { status: 400 }
      );
    }

    // Validate price
    if (isNaN(parseFloat(body.price!.toString()))) {
      return NextResponse.json(
        { success: false, error: "Invalid price format" },
        { status: 400 }
      );
    }

    // Check if property exists and user has permission
    const existingProperty = await propertiesCollection.findOne({
      _id: new ObjectId(propertyId),
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

    // Handle owner details
    const updateData: Partial<Property> = {
      title: body.title!.trim(),
      location: body.location!.trim(),
      size: body.size!.trim(),
      price: parseFloat(body.price!.toString()),
      type: body.type!,
      status: body.status!,
      updated_at: new Date(),
    };

    // Include other optional fields if provided
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.amenities !== undefined) updateData.amenities = body.amenities;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.sqft !== undefined) updateData.sqft = body.sqft;

    // If status is LEASED, include owner details
    if (updateData.status === "LEASED" && body.owner_details) {
      updateData.owner = {
        fullName: body.owner_details.fullName,
        email: body.owner_details.email,
        phone: body.owner_details.phone || "",
        address: body.owner_details.address || "",
        paymentStatus: body.owner_details.paymentStatus || "pending",
        paymentMethod: body.owner_details.paymentMethod || "installment",
      };
    } else if (updateData.status !== "LEASED") {
      updateData.owner = undefined;
    }

    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(propertyId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    const updatedProperty = await propertiesCollection.findOne({
      _id: new ObjectId(propertyId),
    });

    const enrichedProperty: Property = {
      ...updatedProperty!,
      _id: updatedProperty!._id.toString(),
      price: parseFloat(updatedProperty!.price.toString()),
      amenities: updatedProperty!.amenities || [],
      images: updatedProperty!.images || [],
      created_at: updatedProperty!.created_at,
      updated_at: updatedProperty!.updated_at,
      created_by: updatedProperty!.created_by || "",
      title: updatedProperty!.title,
      location: updatedProperty!.location,
      size: updatedProperty!.size,
      type: updatedProperty!.type,
      status: updatedProperty!.status,
      description: updatedProperty!.description,
      bedrooms: updatedProperty!.bedrooms,
      bathrooms: updatedProperty!.bathrooms,
      sqft: updatedProperty!.sqft,
      owner: updatedProperty!.owner,
      inquiries: updatedProperty!.inquiries || [],
    };

    return NextResponse.json({
      success: true,
      property: enrichedProperty,
      message: "Property updated successfully",
    });
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a property (Admin or creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
        { status: 400 }
      );
    }

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
        (inq: any) => inq.status === "pending"
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
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
