// Create: src/app/tenant/payments/cancel/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

const PaymentCancelPage = () => {
  const router = useRouter();

  const handleRetry = () => {
    router.push("/transactions");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <XCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. You can try again anytime.
        </p>
        <button
          onClick={handleRetry}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Payments
        </button>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
