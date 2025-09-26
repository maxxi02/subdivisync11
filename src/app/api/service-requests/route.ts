// src/app/api/service-requests/route.ts
import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId, Collection } from "mongodb";
import {
  ServiceRequest,
  CreateServiceRequest,
} from "@/database/schemas/service-requests";

// Modified POST handler
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (session.user.role !== "tenant") {
      return NextResponse.json(
        { success: false, error: "Only tenants can create service requests" },
        { status: 403 }
      );
    }
    await connectDB();
    const serviceRequestsCollection: Collection<ServiceRequest> =
      db.collection("service-requests");
    const body: CreateServiceRequest = await request.json();
    const requiredFields: (keyof CreateServiceRequest)[] = [
      "category",
      "description",
      "priority",
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
    const serviceRequest: ServiceRequest = {
      id: new ObjectId().toString(),
      category: body.category,
      description: body.description,
      priority: body.priority,
      images: body.images || [],
      status: "pending",
      user_id: session.user.id,
      user_email: session.user.email!,
      user_name: session.user.name!,
      payment_status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    };
    const result = await serviceRequestsCollection.insertOne(serviceRequest);
    if (!result.insertedId) {
      return NextResponse.json(
        { success: false, error: "Failed to create service request" },
        { status: 500 }
      );
    }
    await sendAdminNotification(serviceRequest);
    return NextResponse.json(
      {
        success: true,
        serviceRequest: {
          ...serviceRequest,
          _id: result.insertedId.toString(),
        },
        message: "Service request submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating service request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create service request" },
      { status: 500 }
    );
  }
}
async function sendAdminNotification(request: ServiceRequest) {
  // Implement notification logic (email, push notification, etc.)
  console.log(
    `New service request from ${request.user_name}: ${request.category}`
  );
}

// src/app/api/service-requests/route.ts (GET method)
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
    const serviceRequestsCollection: Collection<ServiceRequest> =
      db.collection("service-requests");

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("id");
    const userRequests = searchParams.get("user") === "true";

    if (requestId) {
      if (!ObjectId.isValid(requestId)) {
        // Try searching by custom id field
        const serviceRequest = await serviceRequestsCollection.findOne({
          id: requestId,
        });
        if (!serviceRequest) {
          return NextResponse.json(
            { success: false, error: "Service request not found" },
            { status: 404 }
          );
        }
        // Check permissions
        if (
          session.user.role !== "admin" &&
          serviceRequest.user_id !== session.user.id
        ) {
          return NextResponse.json(
            { success: false, error: "Access denied" },
            { status: 403 }
          );
        }
        return NextResponse.json({
          success: true,
          serviceRequest: {
            ...serviceRequest,
            _id: serviceRequest._id!.toString(),
          },
        });
      } else {
        const serviceRequest = await serviceRequestsCollection.findOne({
          _id: new ObjectId(requestId),
        });
        if (!serviceRequest) {
          return NextResponse.json(
            { success: false, error: "Service request not found" },
            { status: 404 }
          );
        }
        if (
          session.user.role !== "admin" &&
          serviceRequest.user_id !== session.user.id
        ) {
          return NextResponse.json(
            { success: false, error: "Access denied" },
            { status: 403 }
          );
        }
        return NextResponse.json({
          success: true,
          serviceRequest: {
            ...serviceRequest,
            _id: serviceRequest._id!.toString(),
          },
        });
      }
    }
    // Get multiple requests
    let query = {};

    if (session.user.role === "tenant") {
      // Tenants can only see their own requests
      query = { user_id: session.user.id };
    } else if (session.user.role === "admin") {
      // Admins can see all requests
      if (userRequests) {
        query = { user_id: session.user.id };
      }
      // Otherwise, no filter (get all requests)
    }

    const serviceRequests = await serviceRequestsCollection
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    const transformedRequests = serviceRequests.map((request) => ({
      ...request,
      _id: request._id!.toString(),
      date: request.created_at.toLocaleDateString("en-PH"),
    }));

    return NextResponse.json({
      success: true,
      serviceRequests: transformedRequests,
    });
  } catch (error) {
    console.error("Error fetching service requests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch service requests" },
      { status: 500 }
    );
  }
}

// src/app/api/service-requests/route.ts (Updated PUT method)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(
      "PUT request - User role:",
      session.user.role,
      "User ID:",
      session.user.id
    ); // Debug log

    await connectDB();
    const serviceRequestsCollection: Collection<ServiceRequest> =
      db.collection("service-requests");

    const body = await request.json();
    const { requestId, ...updateData } = body;

    console.log(
      "PUT request - requestId:",
      requestId,
      "updateData:",
      updateData
    ); // Debug log

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Enhanced ID validation: Try _id first, then custom id
    let existingRequest;
    if (ObjectId.isValid(requestId)) {
      existingRequest = await serviceRequestsCollection.findOne({
        _id: new ObjectId(requestId),
      });
    }
    if (!existingRequest) {
      // Fallback to custom id field
      existingRequest = await serviceRequestsCollection.findOne({
        id: requestId,
      });
    }

    if (!existingRequest) {
      console.log("Request not found for requestId:", requestId); // Debug log
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    console.log("Existing request - user_id:", existingRequest.user_id); // Debug log

    // Check permissions
    if (
      session.user.role !== "admin" &&
      existingRequest.user_id !== session.user.id
    ) {
      console.log(
        "Access denied - role:",
        session.user.role,
        "mismatch user_id:",
        existingRequest.user_id
      ); // Debug log
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Tenant restrictions: Allow cancellations and payment_status updates
    const isPaymentUpdate = "payment_status" in updateData;
    const isStatusCancel = updateData.status === "cancelled";
    if (session.user.role === "tenant" && !isStatusCancel && !isPaymentUpdate) {
      console.log("Tenant restriction triggered - updateData:", updateData); // Debug log
      return NextResponse.json(
        {
          success: false,
          error: "Tenants can only cancel requests or update payment status",
        },
        { status: 403 }
      );
    }

    // Prepare update document
    const updateDocument: Partial<ServiceRequest> = {
      ...updateData,
      updated_at: new Date(),
    };

    // Admin-specific updates (unchanged)
    if (session.user.role === "admin") {
      if (updateData.status === "in-progress") {
        await sendTenantNotification(existingRequest, "assigned");
      } else if (updateData.status === "completed") {
        await sendTenantNotification(existingRequest, "completed");
      }
    }

    const result = await serviceRequestsCollection.updateOne(
      { _id: existingRequest._id }, // Use the actual _id from the found document
      { $set: updateDocument }
    );

    if (result.modifiedCount === 0) {
      console.log("No documents modified for requestId:", requestId); // Debug log
      return NextResponse.json(
        { success: false, error: "Failed to update service request" },
        { status: 500 }
      );
    }

    // Fetch updated request
    const updatedRequest = await serviceRequestsCollection.findOne({
      _id: existingRequest._id,
    });

    console.log("Update successful for requestId:", requestId); // Debug log

    return NextResponse.json({
      success: true,
      serviceRequest: {
        ...updatedRequest,
        _id: updatedRequest!._id!.toString(),
      },
      message: "Service request updated successfully",
    });
  } catch (error) {
    console.error("Error updating service request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service request" },
      { status: 500 }
    );
  }
}

async function sendTenantNotification(
  request: ServiceRequest,
  type: "assigned" | "completed"
) {
  // Implement tenant notification logic
  console.log(`Notification sent to ${request.user_email}: ${type}`);
}

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
    const serviceRequestsCollection: Collection<ServiceRequest> =
      db.collection("service-requests");

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId") || searchParams.get("id"); // Support both ?requestId= and ?id=

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Enhanced lookup: Try _id first, then custom id (for consistency with GET/PUT)
    let existingRequest;
    if (ObjectId.isValid(requestId)) {
      existingRequest = await serviceRequestsCollection.findOne({
        _id: new ObjectId(requestId),
      });
    }
    if (!existingRequest) {
      existingRequest = await serviceRequestsCollection.findOne({
        id: requestId, // Fallback for custom id field
      });
    }

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    // Check permissions: Only owner or admin can delete
    if (
      session.user.role !== "admin" &&
      existingRequest.user_id !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Optional: Prevent deletion of non-cancellable requests (e.g., paid or in-progress)
    if (
      existingRequest.payment_status === "paid" ||
      existingRequest.status === "in-progress" ||
      existingRequest.status === "completed"
    ) {
      return NextResponse.json(
        { success: false, error: "Cannot delete paid or in-progress requests" },
        { status: 403 }
      );
    }

    // Delete the document (use the actual _id)
    const result = await serviceRequestsCollection.deleteOne({
      _id: existingRequest._id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to delete service request" },
        { status: 500 }
      );
    }

    // Optional: Send notification (e.g., to admin)
    console.log(
      `Service request deleted by ${session.user.name}: ${requestId}`
    );

    return NextResponse.json({
      success: true,
      message: "Service request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete service request" },
      { status: 500 }
    );
  }
}
