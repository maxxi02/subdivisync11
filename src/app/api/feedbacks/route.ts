import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/database/mongodb";
import { Feedback } from "@/database/schemas/feedback";
import { getServerSession } from "@/better-auth/action";

// POST - Create new feedback
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { rating, message } = body;

    // Validate required fields
    if (!rating || !message) {
      return NextResponse.json(
        { success: false, error: "Rating and message are required" },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Rate limiting - check if user already submitted feedback today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingFeedbackToday = await Feedback.findOne({
      userId: session.user.id,
      createdAt: { $gte: today },
    });

    if (existingFeedbackToday) {
      return NextResponse.json(
        {
          success: false,
          error: "You've already shared feedback today! You can edit your existing feedback instead.",
          feedbackId: existingFeedbackToday._id,
        },
        { status: 429 }
      );
    }

    // Create feedback
    const feedback = await Feedback.create({
      userId: session.user.id,
      userName: session.user.name || "Anonymous",
      userEmail: session.user.email,
      rating,
      message: message.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Feedback submitted successfully",
        feedback,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit feedback",
      },
      { status: 500 }
    );
  }
}

// GET - Fetch feedbacks (with optional filtering)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const userId = searchParams.get("userId");
    const viewAll = searchParams.get("viewAll") === "true";
    const sortBy = searchParams.get("sort") || "createdAt";

    // Build query with proper typing to prevent NoSQL injection
    const query: { userId?: string } = {};
    
    // If this is a public request (viewAll=true), no authentication needed
    if (viewAll) {
      // No additional filters for public view
    }
    // Otherwise, require authentication and filter by user
    else {
      const session = await getServerSession();
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      // If userId is explicitly provided and user is admin, filter by that userId
      if (userId && session.user.role === "admin") {
        query.userId = userId;
      } else {
        // Otherwise show only the user's own feedbacks
        query.userId = session.user.id;
      }
    }

    // Fetch feedbacks with appropriate sorting
    let feedbackQuery = Feedback.find(query);
    
    // Apply sorting
    if (sortBy === "rating") {
      feedbackQuery = feedbackQuery.sort({ rating: -1, createdAt: -1 });
    } else {
      feedbackQuery = feedbackQuery.sort({ createdAt: -1 });
    }
    
    // Apply limit and execute
    const feedbacks = await feedbackQuery
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        success: true,
        feedbacks,
        count: feedbacks.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch feedbacks",
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing feedback
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { feedbackId, rating, message } = body;

    // Validate required fields
    if (!feedbackId || !rating || !message) {
      return NextResponse.json(
        { success: false, error: "Feedback ID, rating, and message are required" },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Find the feedback
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return NextResponse.json(
        { success: false, error: "Feedback not found" },
        { status: 404 }
      );
    }

    // Check if user owns the feedback
    if (feedback.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You can only edit your own feedback" },
        { status: 403 }
      );
    }

    // Update feedback
    feedback.rating = rating;
    feedback.message = message.trim();
    await feedback.save();

    return NextResponse.json(
      {
        success: true,
        message: "Feedback updated successfully",
        feedback,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update feedback",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete feedback
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const feedbackId = searchParams.get("id");

    if (!feedbackId) {
      return NextResponse.json(
        { success: false, error: "Feedback ID is required" },
        { status: 400 }
      );
    }

    // Find the feedback
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return NextResponse.json(
        { success: false, error: "Feedback not found" },
        { status: 404 }
      );
    }

    // Check if user owns the feedback or is admin
    if (feedback.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "You can only delete your own feedback" },
        { status: 403 }
      );
    }

    // Delete feedback
    await Feedback.findByIdAndDelete(feedbackId);

    return NextResponse.json(
      {
        success: true,
        message: "Feedback deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete feedback",
      },
      { status: 500 }
    );
  }
}
