"use client";
import React, { useState, useEffect } from "react";
import {
  Clock,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Eye,
  X,
  Home,
  TrendingUp,
} from "lucide-react";

interface PaymentPlan {
  _id: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  downPayment: number;
  monthlyPayment: number;
  interestRate: number;
  leaseDuration: number;
  totalAmount: number;
  startDate: string;
  currentMonth: number;
  remainingBalance: number;
  nextPaymentDate: string;
  status: string;
  tenant: {
    fullName: string;
    email: string;
    phone: string;
  };
  created_at: string;
}

interface MonthlyPayment {
  _id: string;
  paymentPlanId: string;
  propertyId: string;
  tenantEmail: string;
  monthNumber: number;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  paymentIntentId?: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  receiptUrl?: string;
  created_at: string;
  updated_at: string;
}

const TransactionPage = () => {
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(
    null
  );
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<MonthlyPayment | null>(
    null
  );
  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "overdue"
  >("all");

  // Fetch tenant's payment plans
  const fetchPaymentPlans = async () => {
    try {
      const response = await fetch("/api/tenant/payment-plans");
      const data = await response.json();
      if (data.success) {
        setPaymentPlans(data.paymentPlans);
      } else {
        console.error("Failed to fetch payment plans:", data.error);
        if (data.error === "Unauthorized") {
          alert("Please log in to view your payment plans.");
        }
      }
    } catch (error) {
      console.error("Error fetching payment plans:", error);
      alert("Failed to load payment plans. Please try again.");
    }
  };

  // Fetch tenant's monthly payments
  const fetchMonthlyPayments = async () => {
    try {
      const response = await fetch("/api/tenant/monthly-payments");
      const data = await response.json();
      if (data.success) {
        setMonthlyPayments(data.payments);
      } else {
        console.error("Failed to fetch monthly payments:", data.error);
        if (data.error === "Unauthorized") {
          alert("Please log in to view your payments.");
        }
      }
    } catch (error) {
      console.error("Error fetching monthly payments:", error);
      alert("Failed to load monthly payments. Please try again.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchPaymentPlans(), fetchMonthlyPayments()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter payment plans based on status
  const filteredPaymentPlans = paymentPlans.filter((plan) => {
    if (filter === "all") return true;
    if (filter === "active") return plan.status === "active";
    if (filter === "completed") return plan.status === "completed";
    return false;
  });

  // Get payments for a specific plan
  const getPaymentsForPlan = (planId: string) => {
    return monthlyPayments.filter(
      (payment) => payment.paymentPlanId === planId
    );
  };

  // Get overdue payments
  const getOverduePayments = () => {
    const today = new Date();
    return monthlyPayments.filter(
      (payment) =>
        payment.status === "pending" && new Date(payment.dueDate) < today
    );
  };

  // Update payment plan progress after successful payment
  const updatePaymentPlanProgress = async (
    paymentPlanId: string,
    paymentAmount: number
  ) => {
    try {
      const response = await fetch(
        `/api/tenant/payment-plans/${[paymentPlanId]}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentAmount,
            updateType: "payment_made",
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        console.error("Failed to update payment plan progress:", data.error);
        alert("Failed to update payment plan progress.");
      }
      return data.success;
    } catch (error) {
      console.error("Error updating payment plan progress:", error);
      alert("Failed to update payment plan progress.");
      return false;
    }
  };

  // Process payment with PayMongo
  const processPayment = async (payment: MonthlyPayment) => {
    if (!payment) return;

    try {
      setProcessingPayment(payment._id);

      // Create PayMongo payment intent through tenant endpoint
      const response = await fetch("/api/tenant/payments/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: payment._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.paymentProcessed) {
          // Update payment status - Calls PUT /api/tenant/monthly-payments/[paymentId]
          await markPaymentAsPaid(payment._id, data.paymentIntentId);

          // Update payment plan progress - Calls PUT /api/tenant/payment-plans/[paymentPlanId]/progress
          await updatePaymentPlanProgress(
            payment.paymentPlanId,
            payment.amount
          );

          // Refresh data to update UI
          await Promise.all([fetchPaymentPlans(), fetchMonthlyPayments()]);

          alert("Payment successful!");
          setShowPaymentModal(false);
        } else if (data.checkoutUrl) {
          localStorage.setItem(
            "pendingPayment",
            JSON.stringify({
              paymentId: payment._id,
              paymentPlanId: payment.paymentPlanId,
              amount: payment.amount,
            })
          );
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error("No checkout URL or payment confirmation received");
        }
      } else {
        throw new Error(data.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert(
        `Failed to process payment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setProcessingPayment(null);
      setShowPaymentModal(false);
    }
  };

  // Mark payment as paid
  const markPaymentAsPaid = async (
    paymentId: string,
    paymentIntentId?: string
  ) => {
    try {
      const response = await fetch(
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
            paymentIntentId: paymentIntentId || undefined,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        return true;
      } else {
        throw new Error(data.error || "Failed to update payment");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      alert(
        `Failed to update payment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  // Check for pending payments when component loads
  useEffect(() => {
    const checkPendingPayment = async () => {
      const pendingPayment = localStorage.getItem("pendingPayment");
      if (pendingPayment) {
        try {
          const paymentInfo = JSON.parse(pendingPayment);
          const urlParams = new URLSearchParams(window.location.search);
          const paymentStatus = urlParams.get("status");

          if (paymentStatus === "success") {
            // Mark payment as paid - Calls PUT /api/tenant/monthly-payments/[paymentId]
            const success = await markPaymentAsPaid(paymentInfo.paymentId);
            if (success) {
              // Update payment plan progress - Calls PUT /api/tenant/payment-plans/[paymentPlanId]/progress
              await updatePaymentPlanProgress(
                paymentInfo.paymentPlanId,
                paymentInfo.amount
              );
              // Refresh data to update UI
              await Promise.all([fetchPaymentPlans(), fetchMonthlyPayments()]);
              alert("Payment completed successfully!");
            }
          }
          localStorage.removeItem("pendingPayment");
          if (paymentStatus) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
        } catch (error) {
          console.error("Error processing pending payment:", error);
          localStorage.removeItem("pendingPayment");
          alert("Failed to process pending payment.");
        }
      }
    };

    if (!loading) {
      checkPendingPayment();
    }
  }, [loading]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "paid":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "overdue":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "active":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "completed":
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Payments</h1>
              <p className="text-gray-600 mt-2">
                Manage your property lease payments
              </p>
            </div>
            <div className="flex gap-4">
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(
                    e.target.value as "all" | "active" | "completed" | "overdue"
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Plans</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Plans
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {paymentPlans.filter((p) => p.status === "active").length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Payments
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {monthlyPayments.filter((p) => p.status === "pending").length}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {getOverduePayments().length}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Remaining
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    paymentPlans.reduce(
                      (sum, plan) => sum + plan.remainingBalance,
                      0
                    )
                  )}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {filteredPaymentPlans.map((plan) => {
            const planPayments = getPaymentsForPlan(plan._id);
            const pendingPayments = planPayments.filter(
              (p) => p.status === "pending"
            );
            const nextPayment = pendingPayments.sort(
              (a, b) =>
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            )[0];

            return (
              <div key={plan._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {plan.propertyTitle}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className={getStatusBadge(plan.status)}>
                        {plan.status.charAt(0).toUpperCase() +
                          plan.status.slice(1)}
                      </span>
                      <span>
                        Month {plan.currentMonth} of {plan.leaseDuration}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Payment</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(plan.monthlyPayment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining Balance</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(plan.remainingBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Next Payment</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(plan.nextPaymentDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (plan.currentMonth / plan.leaseDuration) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(
                        (plan.currentMonth / plan.leaseDuration) * 100
                      )}
                      % Complete
                    </p>
                  </div>
                </div>

                {nextPayment && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Payment Due: Month {nextPayment.monthNumber}
                        </p>
                        <p className="text-xs text-yellow-600">
                          Due: {formatDate(nextPayment.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-yellow-800">
                          {formatCurrency(nextPayment.amount)}
                        </p>
                        <span className={getStatusBadge(nextPayment.status)}>
                          {nextPayment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {nextPayment && (
                    <button
                      onClick={() => {
                        setSelectedPayment(nextPayment);
                        setSelectedPlan(plan);
                        setShowPaymentModal(true);
                      }}
                      disabled={processingPayment === nextPayment._id}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      {processingPayment === nextPayment._id
                        ? "Processing..."
                        : "Pay Now"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowDetailsModal(true);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPaymentPlans.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Payment Plans Found
            </h3>
            <p className="text-gray-600">
              You don&#39;t have any {filter !== "all" ? filter : ""} payment
              plans at the moment.
            </p>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedPayment && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Payment
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Property:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedPlan.propertyTitle}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Payment Month:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedPayment.monthNumber} of{" "}
                    {selectedPlan.leaseDuration}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(selectedPayment.dueDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">
                    Current Progress:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedPlan.currentMonth} / {selectedPlan.leaseDuration}{" "}
                    months
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedPayment.amount)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800">
                  <strong>After payment:</strong> Progress will advance to month{" "}
                  {selectedPayment.monthNumber}, and your remaining balance will
                  be reduced by {formatCurrency(selectedPayment.amount)}.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => processPayment(selectedPayment)}
                  disabled={processingPayment === selectedPayment._id}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  {processingPayment === selectedPayment._id
                    ? "Processing..."
                    : "Pay with PayMongo"}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Details Modal */}
        {showDetailsModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Payment Plan Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Plan Overview */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Property Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Property:</span>
                        <span className="text-sm font-medium">
                          {selectedPlan.propertyTitle}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Property Price:
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(selectedPlan.propertyPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Down Payment:
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(selectedPlan.downPayment)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Payment Terms
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Monthly Payment:
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(selectedPlan.monthlyPayment)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Interest Rate:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedPlan.interestRate}% per annum
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Lease Duration:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedPlan.leaseDuration} months
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Total Amount:
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(selectedPlan.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Progress</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedPlan.currentMonth}
                    </p>
                    <p className="text-sm text-gray-600">Payments Made</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {selectedPlan.leaseDuration - selectedPlan.currentMonth}
                    </p>
                    <p className="text-sm text-gray-600">Payments Remaining</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedPlan.remainingBalance)}
                    </p>
                    <p className="text-sm text-gray-600">Remaining Balance</p>
                  </div>
                </div>

                {/* Payment History */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Payment History
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Month
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Paid Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getPaymentsForPlan(selectedPlan._id).map((payment) => (
                          <tr key={payment._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Month {payment.monthNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(payment.dueDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getStatusBadge(payment.status)}>
                                {payment.status.charAt(0).toUpperCase() +
                                  payment.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.paidDate
                                ? formatDate(payment.paidDate)
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {payment.status === "pending" && (
                                <button
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setShowPaymentModal(true);
                                    setShowDetailsModal(false);
                                  }}
                                  disabled={processingPayment === payment._id}
                                  className="text-green-600 hover:text-green-800 disabled:opacity-50 flex items-center gap-1"
                                >
                                  <CreditCard className="h-4 w-4" />
                                  Pay Now
                                </button>
                              )}
                              {payment.status === "paid" &&
                                payment.receiptUrl && (
                                  <a
                                    href={payment.receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Receipt
                                  </a>
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {getPaymentsForPlan(selectedPlan._id).length === 0 && (
                    <div className="text-center py-6 text-gray-600">
                      No payment history available.
                    </div>
                  )}
                </div>

                {/* Tenant Information */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Tenant Information
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Full Name:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedPlan.tenant.fullName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedPlan.tenant.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedPlan.tenant.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Start Date:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(selectedPlan.startDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionPage;
