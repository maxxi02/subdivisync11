"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const ServicePaymentCancelPage = () => {
  const router = useRouter();

  const handleReturn = () => {
    // Clear pending payment
    localStorage.removeItem("pendingServicePayment");
    router.push("/tenant-dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <X className="h-16 w-16 text-orange-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. You can try again anytime.
        </p>
        <button
          onClick={handleReturn}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Service Requests
        </button>
      </div>
    </div>
  );
};

export default ServicePaymentCancelPage;
