// app/api/appointments/[id]/route.ts
import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB, db } from "@/database/mongodb";

// GET - Fetch specific appointment
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
    const appointmentsCollection = db.collection("appointments");
    const propertiesCollection = db.collection("properties");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    const query: { _id: ObjectId; user_id?: string } = {
      _id: new ObjectId(id),
    };

    // Regular users can only view their own appointments
    if (session.user.role !== "admin") {
      query.user_id = session.user.id;
    }

    const appointment = await appointmentsCollection.findOne(query);

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Add property details
    let enrichedAppointment = appointment;
    if (ObjectId.isValid(appointment.property_id)) {
      const property = await propertiesCollection.findOne({
        _id: new ObjectId(appointment.property_id),
      });
      enrichedAppointment = { ...appointment, property };
    }

    return NextResponse.json({
      success: true,
      appointment: enrichedAppointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PUT - Update appointment (Admin can update status, users can update their own details)
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
    const appointmentsCollection = db.collection("appointments");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    // Check if appointment exists and user has permission
    const query: { _id: ObjectId; user_id?: string } = {
      _id: new ObjectId(id),
    };

    if (session.user.role !== "admin") {
      query.user_id = session.user.id;
    }

    const existingAppointment = await appointmentsCollection.findOne(query);

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Admin can update any field, especially status
    if (session.user.role === "admin") {
      const allowedAdminFields = [
        "status",
        "admin_notes",
        "confirmed_date",
        "confirmed_time",
        "meeting_location",
      ];

      allowedAdminFields.forEach((field) => {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      });

      // When confirming appointment, set confirmed date/time
      if (body.status === "confirmed" && !body.confirmed_date) {
        updateData.confirmed_date = existingAppointment.requested_date;
        updateData.confirmed_time = existingAppointment.requested_time;
      }
    } else {
      // Regular users can only update their own appointment details (not status)
      if (existingAppointment.status !== "pending") {
        return NextResponse.json(
          { success: false, error: "Cannot modify non-pending appointment" },
          { status: 400 }
        );
      }

      const allowedUserFields = [
        "requested_date",
        "requested_time",
        "message",
        "contact_phone",
        "preferred_contact_method",
      ];

      allowedUserFields.forEach((field) => {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      });

      // Validate future date if updating requested_date
      if (body.requested_date && body.requested_time) {
        const newDateTime = new Date(
          `${body.requested_date}T${body.requested_time}`
        );
        if (newDateTime <= new Date()) {
          return NextResponse.json(
            { success: false, error: "Appointment date must be in the future" },
            { status: 400 }
          );
        }
        updateData.requested_date = new Date(body.requested_date);
      }
    }

    const result = await appointmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    const updatedAppointment = await appointmentsCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: "Appointment updated successfully",
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/Delete appointment
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
    const appointmentsCollection = db.collection("appointments");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    const query: { _id: ObjectId; user_id?: string } = {
      _id: new ObjectId(id),
    };

    // Regular users can only cancel their own appointments
    if (session.user.role !== "admin") {
      query.user_id = session.user.id;
    }

    const appointment = await appointmentsCollection.findOne(query);

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if appointment can be cancelled
    if (appointment.status === "completed") {
      return NextResponse.json(
        { success: false, error: "Cannot cancel completed appointment" },
        { status: 400 }
      );
    }

    // Soft delete - mark as cancelled instead of hard delete
    const result = await appointmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "cancelled",
          cancelled_at: new Date(),
          cancelled_by: session.user.id,
          updated_at: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
