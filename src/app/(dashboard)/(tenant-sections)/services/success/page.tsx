"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, X } from "lucide-react";

const ServicePaymentSuccessPage = () => {
  const [status, setStatus] = useState<
    "processing" | "pending" | "success" | "error"
  >("processing");
  const [message, setMessage] = useState("Processing your payment...");
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentIntentId = searchParams.get("payment_intent_id");
  const requestId = searchParams.get("request_id");

  useEffect(() => {
    const processPaymentSuccess = async () => {
      if (!paymentIntentId || !requestId) {
        setStatus("error");
        setMessage("Missing payment ID or request ID");
        return;
      }
      try {
        let paymentInfo;
        const pendingPayment = localStorage.getItem("pendingServicePayment");
        if (pendingPayment) {
          paymentInfo = JSON.parse(pendingPayment);
          if (paymentInfo.requestId !== requestId) {
            setStatus("error");
            setMessage("Invalid request ID. Please contact support.");
            return;
          }
        } else {
          const paymentDetailsResponse = await fetch(
            `/api/service-requests?id=${requestId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const paymentDetails = await paymentDetailsResponse.json();
          if (!paymentDetails.success || !paymentDetails.serviceRequest) {
            setStatus("error");
            setMessage(
              "Unable to retrieve payment details. Please contact support."
            );
            return;
          }
          paymentInfo = {
            requestId,
            amount:
              paymentDetails.serviceRequest.final_cost ||
              paymentDetails.serviceRequest.estimated_cost,
            description: paymentDetails.serviceRequest.description,
          };
        }
        const verifyResponse = await fetch(
          `/api/create-payment/verify-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentIntentId,
              requestId,
            }),
          }
        );
        const verifyData = await verifyResponse.json();
        if (!verifyData.success) {
          if (verifyData.status === "pending") {
            setStatus("pending");
            setMessage(
              "Your payment is still pending. We'll notify you once it's confirmed."
            );
            return;
          }
          throw new Error(verifyData.error || "Failed to verify payment");
        }
        const updateResponse = await fetch(`/api/service-requests`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId,
            payment_status: "paid",
            payment_id: paymentIntentId,
            paid_at: new Date().toISOString(),
          }),
        });
        const updateData = await updateResponse.json();
        if (!updateData.success) {
          throw new Error(
            updateData.error || "Failed to update payment status"
          );
        }
        localStorage.removeItem("pendingServicePayment");
        setStatus("success");
        setMessage(
          "Service payment completed successfully! Your request is now fully processed."
        );
        setTimeout(() => {
          router.push("/service-requests");
        }, 3000);
      } catch (error) {
        console.error("Error processing service payment success:", error);
        setStatus("error");
        setMessage(
          "Payment was processed but there was an issue updating the status. Please contact support."
        );
      }
    };

    processPaymentSuccess();
  }, [paymentIntentId, requestId, router]);

  const handleContinue = () => {
    router.push("/service-requests");
  };

  const handleRetryCheck = () => {
    setStatus("processing");
    setMessage("Checking payment status...");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Service Payment
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === "pending" && (
          <>
            <Loader2 className="h-16 w-16 text-yellow-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Pending
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetryCheck}
                className="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                Check Payment Status
              </button>
              <button
                onClick={handleContinue}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              ></button>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Back to Service Requests
              </button>
              <button
                onClick={() => router.push("/services?tab=history")}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Request History
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <X className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Error
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Back to Service Requests
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ServicePaymentSuccessPage;
