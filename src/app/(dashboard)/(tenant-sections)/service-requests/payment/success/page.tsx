"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, X } from "lucide-react";

const ServicePaymentSuccessPage = () => {
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState("Verifying your payment...");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestId = searchParams.get("request_id");

  useEffect(() => {
    const processPaymentSuccess = async () => {
      if (!requestId) {
        setStatus("error");
        setMessage("No request ID provided");
        return;
      }

      try {
        // Retrieve pending payment info from localStorage
        const pendingPayment = localStorage.getItem("pendingServicePayment");
        if (!pendingPayment) {
          setStatus("error");
          setMessage("Payment information missing. Please contact support.");
          return;
        }

        const paymentInfo = JSON.parse(pendingPayment);
        const { checkoutSessionId } = paymentInfo;

        // Update payment status
        const response = await fetch("/api/service-requests/payment/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId,
            checkoutSessionId,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to verify payment");
        }

        // Clear pending payment from localStorage
        localStorage.removeItem("pendingServicePayment");

        setStatus("success");
        setMessage("Payment completed successfully!");
        setReceiptUrl(data.receiptUrl);
      } catch (error) {
        console.error("Error processing payment success:", error);
        setStatus("error");
        setMessage(
          "Payment verification failed. Please contact support with your transaction reference."
        );
      }
    };

    processPaymentSuccess();
  }, [requestId]);

  const handleContinue = () => {
    router.push("/tenant-dashboard"); // Adjust to your service requests page
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Payment
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
            {receiptUrl && (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mb-4 block"
              >
                View Receipt
              </a>
            )}
            <button
              onClick={handleContinue}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Back to Service Requests
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
              Go to Service Requests
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ServicePaymentSuccessPage;
