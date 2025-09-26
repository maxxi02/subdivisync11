"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  DollarSign,
  Eye,
  AlertCircle,
  MapPin,
  Clock,
  CreditCard,
  User,
} from "lucide-react";
import Image from "next/image";
import { getServerSession } from "@/better-auth/action";
import { Session } from "@/better-auth/auth-types";

// Types
interface Inquiry {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

interface Property {
  _id: string;
  title: string;
  location: string;
  size: string;
  price: number;
  type: string;
  status: string;
  images?: string[];
  amenities: string[];
  description?: string;
  sqft?: number;
  created_by: string;
  created_at: string;
  updated_at?: string;
  owner?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    paymentStatus: "paid" | "partial" | "pending";
    paymentMethod?: string;
  };
  inquiries?: Inquiry[];
}

interface InquiryWithProperty extends Inquiry {
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  propertyLocation: string;
  propertyStatus: string;
}

interface PaymentPlan {
  propertyPrice: number;
  downPayment: number;
  monthlyPayment: number;
  interestRate: number;
  leaseDuration: number;
  totalAmount: number;
  startDate: string;
  status: "active" | "inactive" | "completed";
  currentMonth: number;
  remainingBalance: number;
  nextPaymentDate: string;
}

const MyApplication = () => {
  const [inquiries, setInquiries] = useState<InquiryWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] =
    useState<InquiryWithProperty | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [session, setSession] = useState<Session | null>(null);
  const [paymentPlanData, setPaymentPlanData] = useState<PaymentPlan | null>(
    null
  );

  // Fetch session
  useEffect(() => {
    const getSession = async () => {
      const session = await getServerSession();
      setSession(session);
    };
    getSession();
  }, []);

  // Fetch payment plan
  const fetchPaymentPlan = async (propertyId: string, tenantEmail: string) => {
    try {
      const response = await fetch(
        `/api/payments/create?propertyId=${propertyId}&tenantEmail=${tenantEmail}`
      );
      const data = await response.json();

      if (data.success) {
        setPaymentPlanData(data.paymentPlan);
      }
    } catch (error) {
      console.error("Error fetching payment plan:", error);
    }
  };

  // Fetch all properties with inquiries and filter for current user
  const fetchInquiries = useCallback(async () => {
    if (!session?.user.email) return;

    try {
      setLoading(true);
      const response = await fetch("/api/properties?myInquiries=true");
      const data = await response.json();

      if (data.success) {
        const userInquiries: InquiryWithProperty[] = [];
        data.properties.forEach((property: Property) => {
          if (property.inquiries && property.inquiries.length > 0) {
            property.inquiries.forEach((inquiry: Inquiry) => {
              if (inquiry.email === session.user.email) {
                userInquiries.push({
                  ...inquiry,
                  propertyId: property._id,
                  propertyTitle: property.title,
                  propertyPrice: property.price,
                  propertyLocation: property.location,
                  propertyStatus: property.status,
                });
              }
            });
          }
        });
        setInquiries(userInquiries);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchInquiries();
    }
  }, [session, fetchInquiries]);

  // Filter inquiries based on selected filter
  const filteredInquiries = inquiries.filter((inquiry) => {
    if (filter === "all") return true;
    if (filter === "approved") {
      return (
        inquiry.status === "approved" || inquiry.propertyStatus === "LEASED"
      );
    }
    if (filter === "pending") {
      return (
        inquiry.status === "pending" && inquiry.propertyStatus !== "LEASED"
      );
    }
    return inquiry.status === filter;
  });

  const getStatusBadge = (status: string, propertyStatus?: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

    if (propertyStatus === "LEASED") {
      return `${baseClasses} bg-blue-100 text-blue-800`;
    }

    switch (status) {
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "approved":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "rejected":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">
                My Applications
              </h1>
              <p className="text-gray-600 mt-2">
                View your submitted property inquiries
              </p>
            </div>
            <div className="flex gap-4">
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(
                    e.target.value as
                      | "all"
                      | "pending"
                      | "approved"
                      | "rejected"
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Applications
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {inquiries.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {
                    inquiries.filter(
                      (inq) =>
                        inq.status === "pending" &&
                        inq.propertyStatus !== "LEASED"
                    ).length
                  }
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
                <p className="text-sm font-medium text-gray-600">
                  Approved/Leased
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    inquiries.filter(
                      (inq) =>
                        inq.status === "approved" ||
                        inq.propertyStatus === "LEASED"
                    ).length
                  }
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {inquiries.filter((inq) => inq.status === "rejected").length}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application Date
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
                {filteredInquiries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No applications found
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inquiry, index) => (
                    <tr
                      key={`${inquiry.propertyId}-${inquiry.email}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {inquiry.propertyTitle}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {inquiry.propertyLocation}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(inquiry.propertyPrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(inquiry.submittedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={getStatusBadge(
                            inquiry.status,
                            inquiry.propertyStatus
                          )}
                        >
                          {inquiry.propertyStatus === "LEASED"
                            ? "Leased"
                            : inquiry.status.charAt(0).toUpperCase() +
                              inquiry.status.slice(1)}
                        </span>
                        {inquiry.status === "rejected" &&
                          inquiry.rejectionReason && (
                            <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {inquiry.rejectionReason}
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={async () => {
                            setSelectedInquiry(inquiry);
                            setShowViewModal(true);
                            if (
                              inquiry.propertyStatus === "LEASED" ||
                              inquiry.status === "approved"
                            ) {
                              await fetchPaymentPlan(
                                inquiry.propertyId,
                                inquiry.email
                              );
                            }
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Details Modal */}
        {showViewModal && selectedInquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Application Details
              </h3>

              {/* Status Badge */}
              <div className="mb-6">
                <span
                  className={`${getStatusBadge(
                    selectedInquiry.status,
                    selectedInquiry.propertyStatus
                  )} text-sm`}
                >
                  {selectedInquiry.propertyStatus === "LEASED"
                    ? "Leased"
                    : selectedInquiry.status.charAt(0).toUpperCase() +
                      selectedInquiry.status.slice(1)}
                </span>
              </div>

              {/* Applicant Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Image
                    className="h-10 w-10 rounded-full object-cover"
                    src={session?.user.image || "/placeholder.svg"}
                    alt="User Image"
                    width={40}
                    height={40}
                  />
                  Applicant Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email Address</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Application Date
                    </p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedInquiry.submittedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Property Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Property Title</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.propertyTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.propertyLocation}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Price</p>
                    <p className="font-medium text-gray-900">
                      {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      }).format(selectedInquiry.propertyPrice)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Application Reason */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Reason for Application
                </h4>
                <p className="text-gray-700">{selectedInquiry.reason}</p>
              </div>

              {/* Rejection Reason (if rejected) */}
              {selectedInquiry.status === "rejected" &&
                selectedInquiry.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Rejection Reason
                    </h4>
                    <p className="text-red-700">
                      {selectedInquiry.rejectionReason}
                    </p>
                  </div>
                )}

              {/* Approval Status (if approved) */}
              {selectedInquiry.status === "approved" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Application Status
                  </h4>
                  <p className="text-green-700">
                    This application has been approved and a payment plan has
                    been created.
                  </p>
                </div>
              )}

              {/* Payment Plan Details (if leased or approved) */}
              {(selectedInquiry.propertyStatus === "LEASED" ||
                selectedInquiry.status === "approved") &&
                paymentPlanData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Plan Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Property Price
                        </p>
                        <p className="font-medium text-green-900">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(paymentPlanData.propertyPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Down Payment
                        </p>
                        <p className="font-medium text-green-900">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(paymentPlanData.downPayment)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Monthly Payment
                        </p>
                        <p className="font-medium text-green-900">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(paymentPlanData.monthlyPayment)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Interest Rate
                        </p>
                        <p className="font-medium text-green-900">
                          {paymentPlanData.interestRate}% per annum
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Lease Duration
                        </p>
                        <p className="font-medium text-green-900">
                          {paymentPlanData.leaseDuration} months
                          <span className="text-sm text-green-600">
                            {" "}
                            ({Math.floor(
                              paymentPlanData.leaseDuration / 12
                            )}{" "}
                            years {paymentPlanData.leaseDuration % 12} months)
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Total Amount
                        </p>
                        <p className="font-medium text-green-900">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(paymentPlanData.totalAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Start Date
                        </p>
                        <p className="font-medium text-green-900">
                          {new Date(
                            paymentPlanData.startDate
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Plan Status
                        </p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            paymentPlanData.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {paymentPlanData.status.charAt(0).toUpperCase() +
                            paymentPlanData.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Current Month
                        </p>
                        <p className="font-medium text-green-900">
                          {paymentPlanData.currentMonth} of{" "}
                          {paymentPlanData.leaseDuration}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Remaining Balance
                        </p>
                        <p className="font-medium text-green-900">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(paymentPlanData.remainingBalance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Next Payment Date
                        </p>
                        <p className="font-medium text-green-900">
                          {new Date(
                            paymentPlanData.nextPaymentDate
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 mb-1">
                          Total Interest
                        </p>
                        <p className="font-medium text-orange-600">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(
                            paymentPlanData.totalAmount -
                              paymentPlanData.propertyPrice
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {selectedInquiry.propertyStatus === "LEASED" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Property Status
                  </h4>
                  <p className="text-blue-700">
                    This property has been leased and a payment plan is active.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedInquiry(null);
                    setPaymentPlanData(null);
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

export default MyApplication;
