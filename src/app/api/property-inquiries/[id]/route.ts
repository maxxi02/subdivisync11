// app/api/property-inquiries/[id]/route.ts
import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB, db } from "@/database/mongodb";

// Define the update data interface
interface UpdatePropertyInquiryData {
  fullName?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  email?: string;
  currentAddress?: string;
  preferredContactMethod?: "phone" | "email" | "text";
  preferredContactTime?: string;
  selectedPropertyId?: string;
  specificLotUnit?: string;
  propertyType?:
    | "residential-lot"
    | "commercial"
    | "house-and-lot"
    | "condo"
    | "other";
  budgetRange?: string;
  preferredLotSize?: string;
  timeline?:
    | "immediate"
    | "1-3-months"
    | "3-6-months"
    | "6-12-months"
    | "flexible";
  paymentMethod?: "cash" | "financing" | "installment";
  additionalRequirements?: string;
  status?:
    | "new"
    | "contacted"
    | "viewing-scheduled"
    | "negotiating"
    | "closed"
    | "rejected";
  rejectionReason?: string;
  priority?: "high" | "medium" | "low";
  updated_at?: Date;
}

// GET - Fetch single property inquiry
export async function GET(
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
    const inquiriesCollection = db.collection("property_inquiries");
    const propertiesCollection = db.collection("properties");
    const usersCollection = db.collection("users");

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid inquiry ID" },
        { status: 400 }
      );
    }

    const query: { _id: ObjectId; created_by?: string } = {
      _id: new ObjectId(id),
    };

    // Non-admin users can only view their own inquiries
    if (session.user.role !== "admin") {
      query.created_by = session.user.id;
    }

    const inquiry = await inquiriesCollection.findOne(query);

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found or access denied" },
        { status: 404 }
      );
    }

    // Enrich inquiry with property and tenant information
    const enrichedInquiry = { ...inquiry };

    // Add property information if selectedPropertyId exists
    if (inquiry.selectedPropertyId) {
      try {
        const property = await propertiesCollection.findOne(
          { _id: inquiry.selectedPropertyId },
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
          enrichedInquiry.property = {
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

    // Add tenant information if created_by exists (for admin view)
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
          enrichedInquiry.tenant = {
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

    return NextResponse.json({
      success: true,
      inquiry: enrichedInquiry,
    });
  } catch (error) {
    console.error("Error fetching property inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch property inquiry" },
      { status: 500 }
    );
  }
}

// PUT - Update property inquiry
export async function PUT(
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
    const inquiriesCollection = db.collection("property_inquiries");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid inquiry ID" },
        { status: 400 }
      );
    }

    const body: UpdatePropertyInquiryData = await request.json();

    // Check if inquiry exists and user has permission
    const query: { _id: ObjectId; created_by?: string } = {
      _id: new ObjectId(id),
    };

    // Non-admin users can only update their own inquiries
    if (session.user.role !== "admin") {
      query.created_by = session.user.id;
    }

    const existingInquiry = await inquiriesCollection.findOne(query);

    if (!existingInquiry) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found or access denied" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: UpdatePropertyInquiryData = {
      ...body,
      updated_at: new Date(),
    };

    // Remove fields that shouldn't be updated directly
    delete (updateData as Record<string, unknown>)._id;
    delete (updateData as Record<string, unknown>).created_at;
    delete (updateData as Record<string, unknown>).created_by;

    // Validate fields if they exist in the update
    if (
      updateData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (updateData.primaryPhone) {
      const phoneRegex = /^(\+63|0)[0-9]{10}$/;
      if (!phoneRegex.test(updateData.primaryPhone.replace(/\s+/g, ""))) {
        return NextResponse.json(
          { success: false, error: "Invalid phone number format" },
          { status: 400 }
        );
      }
    }

    // Validate status (admin only)
    if (updateData.status && session.user.role === "admin") {
      const validStatuses = [
        "new",
        "contacted",
        "viewing-scheduled",
        "negotiating",
        "closed",
        "rejected",
        "owned",
      ] as const;
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 }
        );
      }
    } else if (updateData.status && session.user.role !== "admin") {
      // Remove status from update if user is not admin
      delete updateData.status;
    }

    // Validate priority (admin only)
    if (updateData.priority && session.user.role === "admin") {
      const validPriorities = ["high", "medium", "low"] as const;
      if (!validPriorities.includes(updateData.priority)) {
        return NextResponse.json(
          { success: false, error: "Invalid priority" },
          { status: 400 }
        );
      }
    } else if (updateData.priority && session.user.role !== "admin") {
      // Remove priority from update if user is not admin
      delete updateData.priority;
    }

    // Clean string fields
    const stringFields: (keyof UpdatePropertyInquiryData)[] = [
      "fullName",
      "primaryPhone",
      "secondaryPhone",
      "email",
      "currentAddress",
      "preferredContactTime",
      "specificLotUnit",
      "budgetRange",
      "preferredLotSize",
      "additionalRequirements",
    ];

    stringFields.forEach((field) => {
      const value = updateData[field];
      if (value && typeof value === "string") {
        (updateData as Record<string, string>)[field] = value.trim();
      }
    });

    // Update email to lowercase
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    const result = await inquiriesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    const inquiry = await inquiriesCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      inquiry,
      message: "Inquiry updated successfully",
    });
  } catch (error) {
    console.error("Error updating property inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update property inquiry" },
      { status: 500 }
    );
  }
}

// DELETE - Delete property inquiry
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
    const inquiriesCollection = db.collection("property_inquiries");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid inquiry ID" },
        { status: 400 }
      );
    }

    const query: { _id: ObjectId; created_by?: string } = {
      _id: new ObjectId(id),
    };

    // Non-admin users can only delete their own inquiries
    if (session.user.role !== "admin") {
      query.created_by = session.user.id;
    }

    const result = await inquiriesCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting property inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete property inquiry" },
      { status: 500 }
    );
  }
}
