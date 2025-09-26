// src/app/(dashboard)/(tenant-sections)/services/cancel/page.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft } from "lucide-react";

const ServicePaymentCancelPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request_id");

  const handleRetry = () => {
    if (requestId) {
      router.push(`/services?payment_retry=${requestId}`);
    } else {
      router.push("/services");
    }
  };

  const handleBackToServices = () => {
    router.push("/services");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <XCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          Your service payment was cancelled. Don&#39;t worry - you can try
          again anytime. Your service request remains active.
        </p>

        <div className="space-y-3">
          {requestId && (
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Retry Payment
            </button>
          )}

          <button
            onClick={handleBackToServices}
            className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Services
          </button>
        </div>

        {requestId && (
          <p className="text-sm text-gray-500 mt-4">Request ID: {requestId}</p>
        )}
      </div>
    </div>
  );
};

export default ServicePaymentCancelPage;
