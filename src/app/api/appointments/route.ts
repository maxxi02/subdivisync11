// app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch appointments (Admin sees all, users see their own)
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
    const appointmentsCollection = db.collection("appointments");
    const propertiesCollection = db.collection("properties");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const propertyId = searchParams.get("property_id");

    const query: Record<string, unknown> = {};

    // Regular users can only see their own appointments
    if (session.user.role !== "admin") {
      query.user_id = session.user.id;
    }

    // Apply filters
    if (status && status !== "all") {
      query.status = status;
    }

    if (propertyId && ObjectId.isValid(propertyId)) {
      query.property_id = propertyId;
    }

    const appointments = await appointmentsCollection
      .find(query)
      .sort({ requested_date: 1 })
      .toArray();

    // Populate property details
    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        if (ObjectId.isValid(appointment.property_id)) {
          const property = await propertiesCollection.findOne({
            _id: new ObjectId(appointment.property_id),
          });
          return { ...appointment, property };
        }
        return appointment;
      })
    );

    return NextResponse.json({
      success: true,
      appointments: enrichedAppointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST - Create new appointment request
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
    const appointmentsCollection = db.collection("appointments");
    const propertiesCollection = db.collection("properties");

    const body = await request.json();
    const {
      property_id,
      requested_date,
      requested_time,
      message,
      contact_phone,
      preferred_contact_method = "email",
    } = body;

    // Validate required fields
    if (!property_id || !requested_date || !requested_time) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify property exists and is available
    if (!ObjectId.isValid(property_id)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID" },
        { status: 400 }
      );
    }

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(property_id),
      availability_status: "Available",
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found or not available" },
        { status: 404 }
      );
    }

    // Check if user already has a pending/confirmed appointment for this property
    const existingAppointment = await appointmentsCollection.findOne({
      property_id,
      user_id: session.user.id,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingAppointment) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending appointment for this property",
        },
        { status: 400 }
      );
    }

    // Validate requested date is not in the past
    const requestedDateTime = new Date(`${requested_date}T${requested_time}`);
    const now = new Date();

    if (requestedDateTime <= now) {
      return NextResponse.json(
        { success: false, error: "Appointment date must be in the future" },
        { status: 400 }
      );
    }

    const appointment = {
      property_id,
      user_id: session.user.id,
      user_name: session.user.name,
      user_email: session.user.email,
      contact_phone: contact_phone || null,
      preferred_contact_method,
      requested_date: new Date(requested_date),
      requested_time,
      message: message || "",
      status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await appointmentsCollection.insertOne(appointment);
    const createdAppointment = await appointmentsCollection.findOne({
      _id: result.insertedId,
    });

    // Add property details to response
    const enrichedAppointment = {
      ...createdAppointment,
      property,
    };

    return NextResponse.json(
      {
        success: true,
        appointment: enrichedAppointment,
        message: "Appointment request submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
