// src/app/api/admin/migrations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createUserSecurityCollection } from "@/database/migrations/create-user-security-collection";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { migrationType } = body;

    if (!migrationType || migrationType !== "create-user-security") {
      return NextResponse.json(
        { success: false, message: "Invalid migration type" },
        { status: 400 }
      );
    }

    // Run the migration
    const result = await createUserSecurityCollection();

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        migrationType,
        documentCount: result.documentCount,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Migration error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Migration failed",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Return available migrations
    const migrations = [
      {
        id: "create-user-security",
        name: "Create UserSecurity Collection",
        description: "Creates the UserSecurity collection for failed login tracking",
        status: "available",
      },
    ];

    return NextResponse.json({
      success: true,
      data: { migrations },
    });

  } catch (error) {
    console.error("Get migrations error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch migrations",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}