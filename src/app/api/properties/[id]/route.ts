// src/app/api/properties/[id]/route.ts with new POST for rejection

import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId, Collection } from "mongodb";
import { connectDB, db } from "@/database/mongodb";
import { Session } from "@/better-auth/auth-types";

export interface Property {
  _id: string;
  title: string;
  location: string;
  size: string;
  price: number;
  type: string;
  status: string;
  images?: string[];
  amenities: string[];
  description?: string;
  sqft?: number;
  created_by: string;
  created_at: string;
  updated_at?: string;
  owner?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    paymentStatus: "paid" | "partial" | "pending";
    paymentMethod?: string;
    paymentPlan?: PaymentPlan;
  };
  inquiries?: Inquiry[];
}

interface PaymentPlan {
  propertyPrice: number;
  downPayment: number;
  monthlyPayment: number;
  interestRate: number;
  leaseDuration: number;
  totalAmount: number;
  startDate: string;
  status: string;
  currentMonth: number;
  remainingBalance: number;
  nextPaymentDate: string;
  paymentPlanId?: string;
}

interface Inquiry {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

interface DBProperty {
  _id: ObjectId;
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
    paymentPlan?: PaymentPlan;
  };
  inquiries?: Inquiry[];
}

interface UpdatePropertyRequest extends Partial<Property> {
  owner_details?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    paymentStatus?: "paid" | "partial" | "pending";
    paymentMethod?: string;
    paymentPlan?: PaymentPlan;
  };
  inquiry?: Inquiry;
  isInquiry?: boolean;
}

// GET - Fetch a single property by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const propertiesCollection: Collection<DBProperty> =
      db.collection("properties");
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

    const enrichedProperty: Property = {
      ...property,
      _id: property._id.toString(),
      price: Number(property.price),
      amenities: property.amenities || [],
      images: property.images || [],
      created_at: property.created_at.toISOString(),
      updated_at: property.updated_at?.toISOString(),
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
    const propertiesCollection: Collection<DBProperty> =
      db.collection("properties");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
        { status: 400 }
      );
    }

    const body: UpdatePropertyRequest = await request.json();

    if (body.isInquiry && body.inquiry) {
      return handleInquirySubmission(propertiesCollection, id, body.inquiry);
    }

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

// POST - Reject an inquiry
export async function POST(
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
    const propertiesCollection: Collection<DBProperty> =
      db.collection("properties");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (body.action !== "reject") {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    const { email, phone, reason } = body;

    if (!email || !phone || !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
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

    if (
      session.user.role !== "admin" &&
      property.created_by !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const inquiries = property.inquiries || [];
    let updated = false;

    const updatedInquiries = inquiries.map((inq: Inquiry) => {
      if (
        inq.email.toLowerCase() === email.toLowerCase() &&
        inq.phone === phone &&
        inq.status === "pending"
      ) {
        updated = true;
        return {
          ...inq,
          status: "rejected" as const,
          rejectionReason: reason.trim(),
        };
      }
      return inq;
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "No pending inquiry found to reject" },
        { status: 400 }
      );
    }

    const hasPending = updatedInquiries.some((inq) => inq.status === "pending");

    const newStatus = hasPending ? property.status : "CREATED";

    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          inquiries: updatedInquiries,
          status: newStatus,
          updated_at: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to reject inquiry" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inquiry rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reject inquiry" },
      { status: 500 }
    );
  }
}

// Handle inquiry submission (public endpoint)
async function handleInquirySubmission(
  propertiesCollection: Collection<DBProperty>,
  propertyId: string,
  inquiry: Inquiry
) {
  try {
    const requiredFields = ["fullName", "email", "phone", "reason"];
    const missingFields = requiredFields.filter(
      (field) => !inquiry[field as keyof typeof inquiry]
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

    const existingInquiries = existingProperty.inquiries || [];
    const hasExistingInquiry = existingInquiries.some(
      (inq) =>
        inq.email.toLowerCase() === inquiry.email.toLowerCase() &&
        (inq.status === "pending" || inq.status === "approved")
    );

    if (hasExistingInquiry) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You already have a pending or approved inquiry for this property",
        },
        { status: 400 }
      );
    }

    const newInquiry = {
      fullName: inquiry.fullName.trim(),
      email: inquiry.email.toLowerCase().trim(),
      phone: inquiry.phone.trim(),
      reason: inquiry.reason.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending" as const,
    };

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
      price: Number(updatedProperty!.price),
      amenities: updatedProperty!.amenities || [],
      images: updatedProperty!.images || [],
      created_at: updatedProperty!.created_at.toISOString(),
      updated_at: updatedProperty!.updated_at?.toISOString(),
      created_by: updatedProperty!.created_by || "",
      title: updatedProperty!.title,
      location: updatedProperty!.location,
      size: updatedProperty!.size,
      type: updatedProperty!.type,
      status: updatedProperty!.status,
      description: updatedProperty!.description,
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
  propertiesCollection: Collection<DBProperty>,
  propertyId: string,
  body: UpdatePropertyRequest,
  session: Session
) {
  try {
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

    if (isNaN(Number(body.price))) {
      return NextResponse.json(
        { success: false, error: "Invalid price format" },
        { status: 400 }
      );
    }

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

    const updateData: Partial<DBProperty> = {
      title: body.title!.trim(),
      location: body.location!.trim(),
      size: body.size!.trim(),
      price: Number(body.price),
      type: body.type! as
        | "residential-lot"
        | "commercial"
        | "house-and-lot"
        | "condo",
      status: body.status! as
        | "CREATED"
        | "UNDER_INQUIRY"
        | "APPROVED"
        | "REJECTED"
        | "LEASED",
      updated_at: new Date(),
    };

    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.amenities !== undefined) updateData.amenities = body.amenities;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.sqft !== undefined) updateData.sqft = body.sqft;
    if (body.inquiries !== undefined) updateData.inquiries = body.inquiries;

    if (updateData.status === "LEASED" && body.owner_details) {
      updateData.owner = {
        fullName: body.owner_details.fullName,
        email: body.owner_details.email,
        phone: body.owner_details.phone || "",
        address: body.owner_details.address || "",
        paymentStatus: body.owner_details.paymentStatus || "pending",
        paymentMethod: body.owner_details.paymentMethod || "installment",
        paymentPlan: body.owner_details.paymentPlan,
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
      price: Number(updatedProperty!.price),
      amenities: updatedProperty!.amenities || [],
      images: updatedProperty!.images || [],
      created_at: updatedProperty!.created_at.toISOString(),
      updated_at: updatedProperty!.updated_at?.toISOString(),
      created_by: updatedProperty!.created_by || "",
      title: updatedProperty!.title,
      location: updatedProperty!.location,
      size: updatedProperty!.size,
      type: updatedProperty!.type,
      status: updatedProperty!.status,
      description: updatedProperty!.description,
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

// DELETE - Delete a property or a specific rejected inquiry
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
    const propertiesCollection: Collection<DBProperty> =
      db.collection("properties");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email } = body;

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
          error: "Unauthorized - No permission to modify this property",
        },
        { status: 403 }
      );
    }

    // If email is provided, delete the specific rejected inquiry
    if (email) {
      const updatedInquiries = (existingProperty.inquiries || []).filter(
        (inquiry) =>
          !(
            inquiry.email.toLowerCase() === email.toLowerCase() &&
            inquiry.status === "rejected"
          )
      );

      const newStatus =
        updatedInquiries.length === 0 &&
        existingProperty.status === "UNDER_INQUIRY"
          ? "CREATED"
          : existingProperty.status;

      const result = await propertiesCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            inquiries: updatedInquiries,
            status: newStatus,
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

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No rejected inquiry found for the provided email",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Rejected inquiry deleted successfully",
      });
    }

    // Otherwise, delete the entire property
    const pendingInquiries =
      existingProperty.inquiries?.filter((inq) => inq.status === "pending") ||
      [];

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
    console.error("Error deleting property or inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete property or inquiry" },
      { status: 500 }
    );
  }
}
