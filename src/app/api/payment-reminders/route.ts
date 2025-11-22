import { NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { sendEmail } from "@/resend/resend";

export async function POST() {
  try {
    await connectDB();
    const monthlyPaymentsCollection = db.collection("monthly_payments");
    const today = new Date();
    const sevenDaysFromNow = new Date(
      today.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    // Find payments due within 7 days
    const upcomingPayments = await monthlyPaymentsCollection
      .find({
        status: "pending",
        dueDate: {
          $gte: today.toISOString(),
          $lte: sevenDaysFromNow.toISOString(),
        },
      })
      .toArray();

    const emailPromises = upcomingPayments.map(async (payment) => {
      const daysUntilDue = Math.ceil(
        (new Date(payment.dueDate).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      try {
        await sendEmail({
          to: [{ 
            email: payment.tenantEmail, 
            name: payment.tenantName 
          }],
          subject: `Payment Reminder: Due in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Payment Reminder</h2>
              <p>Dear ${payment.tenantName},</p>
              <p>This is a friendly reminder that your monthly payment is due soon.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <p><strong>Property:</strong> ${payment.propertyTitle}</p>
                <p><strong>Amount Due:</strong> ₱${payment.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                <p><strong>Due Date:</strong> ${new Date(
                  payment.dueDate
                ).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
                <p><strong>Days Until Due:</strong> ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}</p>
              </div>
              
              <p>Please ensure your payment is made on or before the due date to avoid late fees.</p>
              <p>If you have already made this payment, please disregard this notice.</p>
              
              <p style="margin-top: 30px;">Best regards,<br/>SubdivisSync Management</p>
            </div>
          `,
          textContent: `
Payment Reminder

Dear ${payment.tenantName},

This is a friendly reminder that your monthly payment is due soon.

Payment Details:
- Property: ${payment.propertyTitle}
- Amount Due: ₱${payment.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
- Due Date: ${new Date(payment.dueDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
- Days Until Due: ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}

Please ensure your payment is made on or before the due date to avoid late fees.
If you have already made this payment, please disregard this notice.

Best regards,
SubdivisSync Management
          `,
          sender: {
            email: process.env.BREVO_SENDER_EMAIL!,
            name: "SubdiviSync"
          }
        });

        // Update last reminder sent date
        await monthlyPaymentsCollection.updateOne(
          { _id: payment._id },
          {
            $set: {
              lastReminderSent: today.toISOString(),
              reminderCount: (payment.reminderCount || 0) + 1,
            },
          }
        );

        return { success: true, email: payment.tenantEmail };
      } catch (error) {
        console.error(`Failed to send email to ${payment.tenantEmail}:`, error);
        return { success: false, email: payment.tenantEmail, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} of ${upcomingPayments.length} payment reminders`,
      results,
    });
  } catch (error) {
    console.error("Error sending payment reminders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send payment reminders" },
      { status: 500 }
    );
  }
}