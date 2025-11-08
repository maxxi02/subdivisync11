import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";

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
    const body = await request.json();
    const { name, image, address, gender, age, phoneNumber } = body;
    const finalAddress = address?.trim() || "n/a";
    const finalPhoneNumber = phoneNumber?.trim() || "n/a";

    console.log("Update user request:", {
      userId: session.user.id,
      name,
      address,
      sessionUser: session.user,
    });

    if (!gender) {
      return NextResponse.json(
        { success: false, error: "Gender is required" },
        { status: 400 }
      );
    }

    if (!age || age < 18 || age > 120) {
      return NextResponse.json(
        { success: false, error: "Valid age is required (18-120)" },
        { status: 400 }
      );
    }

    if (!phoneNumber?.trim()) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Check if user exists - Better-Auth uses 'id' field (UUID string)
    const existingUser = await db.collection("user").findOne({
      id: session.user.id,
    });

    console.log("User lookup:", {
      searchingFor: session.user.id,
      found: existingUser ? "Yes" : "No",
      existingUserId: existingUser?.id,
      existingUserObjectId: existingUser?._id,
    });

    if (!existingUser) {
      // Try alternate query in case the field name is different
      const altUser = await db.collection("user").findOne({
        email: session.user.email,
      });

      console.log("Alternate user lookup by email:", {
        email: session.user.email,
        found: altUser ? "Yes" : "No",
      });

      if (altUser) {
        console.log("User found by email, updating...");
        // Use the email to update instead
        const result = await db.collection("user").updateOne(
          { email: session.user.email },
          {
            $set: {
              name: name.trim(),
              image,
              address: finalAddress,
              gender,
              age: parseInt(age.toString()),
              phoneNumber: finalPhoneNumber,
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          return NextResponse.json(
            { success: false, error: "Failed to update user" },
            { status: 404 }
          );
        }

        return NextResponse.json(
          {
            success: true,
            message: "Profile updated successfully",
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update user in database using 'id' field (Better-Auth standard)
    const result = await db.collection("user").updateOne(
      { id: session.user.id },
      {
        $set: {
          name: name.trim(),
          image,
          address: finalAddress,
          gender,
          age: parseInt(age.toString()),
          phoneNumber: finalPhoneNumber,
          updatedAt: new Date(),
        },
      }
    );

    console.log("Update result:", {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found during update" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
