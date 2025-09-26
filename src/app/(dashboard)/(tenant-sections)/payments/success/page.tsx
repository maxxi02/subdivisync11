// src/app/payments/success/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, X } from "lucide-react";

const PaymentSuccessPage = () => {
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState("Processing your payment...");
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    const processPaymentSuccess = async () => {
      if (!paymentId) {
        setStatus("error");
        setMessage("No payment ID provided");
        return;
      }

      try {
        // Retrieve pending payment info from localStorage
        const pendingPayment = localStorage.getItem("pendingPayment");
        if (!pendingPayment) {
          setStatus("error");
          setMessage("Payment information missing. Please contact support.");
          return;
        }

        const paymentInfo = JSON.parse(pendingPayment);
        const { paymentPlanId, amount } = paymentInfo;

        // Step 1: Mark payment as paid
        const paymentResponse = await fetch(
          `/api/tenant/monthly-payments/${paymentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "paid",
              paidDate: new Date().toISOString(),
              paymentMethod: "PayMongo",
            }),
          }
        );

        const paymentData = await paymentResponse.json();

        if (!paymentData.success) {
          throw new Error(
            paymentData.error || "Failed to update payment status"
          );
        }

        // Step 2: Update payment plan progress
        const planResponse = await fetch(
          `/api/tenant/payment-plans/${paymentPlanId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentAmount: amount,
              updateType: "payment_made",
            }),
          }
        );

        const planData = await planResponse.json();

        if (!planData.success) {
          throw new Error(
            planData.error || "Failed to update payment plan progress"
          );
        }

        // Clear pending payment from localStorage
        localStorage.removeItem("pendingPayment");

        setStatus("success");
        setMessage("Payment completed successfully!");
      } catch (error) {
        console.error("Error processing payment success:", error);
        setStatus("error");
        setMessage(
          "Payment was processed but failed to update status. Please contact support."
        );
      }
    };

    processPaymentSuccess();
  }, [paymentId]);

  const handleContinue = () => {
    router.push("/transactions");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Payment
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={handleContinue}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue to Payments
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <X className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={handleContinue}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Payments
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
