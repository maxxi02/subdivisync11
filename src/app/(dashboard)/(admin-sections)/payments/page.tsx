"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Eye,
  AlertTriangle,
  User,
  Mail,
  Clock,
  CreditCard,
  Send,
  FileText,
  Home,
  Search,
  RefreshCw,
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
  paidDate?: string;
  status: "pending" | "paid" | "overdue" | "partial";
  paymentMethod?: string;
  paymentIntentId?: string;
  receiptUrl?: string;
  proofUrl?: string;
  notes?: string;
  created_at: string;
}

interface PaymentWithPlan extends MonthlyPayment {
  paymentPlan?: PaymentPlan;
}

const PaymentsTrackingPage = () => {
  const [payments, setPayments] = useState<PaymentWithPlan[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "paid" | "pending" | "overdue" | "partial"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentWithPlan | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch payment plans and monthly payments
  const fetchPaymentData = async () => {
    try {
      setLoading(true);

      // Fetch payment plans
      const plansResponse = await fetch("/api/payment-plans/all");
      const plansData = await plansResponse.json();

      // Fetch monthly payments
      const paymentsResponse = await fetch("/api/monthly-payments");
      const paymentsData = await paymentsResponse.json();

      if (plansData.success) {
        setPaymentPlans(plansData.paymentPlans);
      }

      if (paymentsData.success) {
        // Combine payments with their payment plans
        const paymentsWithPlans = paymentsData.payments.map(
          (payment: MonthlyPayment) => {
            const plan = plansData.paymentPlans?.find(
              (p: PaymentPlan) => p._id === payment.paymentPlanId
            );
            return { ...payment, paymentPlan: plan };
          }
        );
        setPayments(paymentsWithPlans);
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  // Calculate overdue payments
  const updateOverduePayments = () => {
    const today = new Date();
    return payments.map((payment) => {
      if (payment.status === "pending" && new Date(payment.dueDate) < today) {
        return { ...payment, status: "overdue" as const };
      }
      return payment;
    });
  };

  // Get filtered payments
  const getFilteredPayments = () => {
    let filtered = updateOverduePayments();

    if (filter !== "all") {
      filtered = filtered.filter((p) => p.status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.paymentPlan?.tenant.fullName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          p.paymentPlan?.propertyTitle
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          p.tenantEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );
  };

  // Calculate statistics
  const stats = {
    totalCollected: payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments
      .filter((p) => p.status === "pending" || p.status === "overdue")
      .reduce((sum, p) => sum + p.amount, 0),
    overdueCount: updateOverduePayments().filter((p) => p.status === "overdue")
      .length,
    totalPayments: payments.length,
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "paid":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "overdue":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "partial":
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
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

  const filteredPayments = getFilteredPayments();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Payment Tracking
              </h1>
              <p className="text-gray-600 mt-2">
                Monitor and manage rental payments from all tenants
              </p>
            </div>
            <button
              onClick={fetchPaymentData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">
                  Total Collected
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalCollected)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-100">
                  Pending Collection
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-100">
                  Overdue Payments
                </p>
                <p className="text-2xl font-bold">{stats.overdueCount}</p>
              </div>
              <div className="h-12 w-12 bg-red-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">
                  Total Payments
                </p>
                <p className="text-2xl font-bold">{stats.totalPayments}</p>
              </div>
              <div className="h-12 w-12 bg-blue-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Alert */}
        {stats.overdueCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Overdue Payments Alert
                </h3>
                <p className="text-sm text-red-700">
                  You have {stats.overdueCount} overdue payment
                  {stats.overdueCount > 1 ? "s" : ""} requiring immediate
                  attention.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tenants or properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant & Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.paymentPlan?.tenant.fullName ||
                                "Unknown Tenant"}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Home className="h-3 w-3" />
                              {payment.paymentPlan?.propertyTitle ||
                                "Property Not Found"}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {payment.tenantEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Month {payment.monthNumber} of{" "}
                          {payment.paymentPlan?.leaseDuration || "N/A"}
                        </div>
                        {payment.paymentMethod && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {payment.paymentMethod}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(payment.dueDate)}
                        </div>
                        {payment.paidDate && (
                          <div className="text-sm text-gray-500">
                            Paid: {formatDate(payment.paidDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowDetailsModal(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          {payment.status === "pending" && (
                            <button className="bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 flex items-center gap-1">
                              <Send className="h-4 w-4" />
                              Remind
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Details Modal */}
        {showDetailsModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Payment Details
              </h3>

              {/* Payment Status */}
              <div className="mb-6">
                <span
                  className={`${getStatusBadge(
                    selectedPayment.status
                  )} text-sm`}
                >
                  {selectedPayment.status.charAt(0).toUpperCase() +
                    selectedPayment.status.slice(1)}
                </span>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Amount</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(selectedPayment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Month Number</p>
                    <p className="font-medium text-gray-900">
                      {selectedPayment.monthNumber} of{" "}
                      {selectedPayment.paymentPlan?.leaseDuration || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Due Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(selectedPayment.dueDate)}
                    </p>
                  </div>
                  {selectedPayment.paidDate && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Paid Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(selectedPayment.paidDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tenant Information */}
              {selectedPayment.paymentPlan && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Tenant Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Full Name</p>
                      <p className="font-medium text-gray-900">
                        {selectedPayment.paymentPlan.tenant.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-medium text-gray-900">
                        {selectedPayment.paymentPlan.tenant.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone</p>
                      <p className="font-medium text-gray-900">
                        {selectedPayment.paymentPlan.tenant.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Property</p>
                      <p className="font-medium text-gray-900">
                        {selectedPayment.paymentPlan.propertyTitle}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Plan Summary */}
              {selectedPayment.paymentPlan && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Plan Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-600 mb-1">
                        Monthly Payment
                      </p>
                      <p className="font-medium text-blue-900">
                        {formatCurrency(
                          selectedPayment.paymentPlan.monthlyPayment
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 mb-1">
                        Total Duration
                      </p>
                      <p className="font-medium text-blue-900">
                        {selectedPayment.paymentPlan.leaseDuration} months
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 mb-1">Progress</p>
                      <p className="font-medium text-blue-900">
                        {Math.round(
                          (selectedPayment.monthNumber /
                            selectedPayment.paymentPlan.leaseDuration) *
                            100
                        )}
                        % Complete
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 mb-1">
                        Remaining Balance
                      </p>
                      <p className="font-medium text-blue-900">
                        {formatCurrency(
                          selectedPayment.paymentPlan.remainingBalance
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedPayment(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
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

export default PaymentsTrackingPage;
