"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Eye,
  Check,
  X,
  Trash2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  User,
  Search,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { getServerSession } from "@/better-auth/action";
import { Session } from "@/better-auth/auth-types";
import { Center, Container, Loader } from "@mantine/core";

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
  status: string;
  currentMonth: number;
  remainingBalance: number;
  nextPaymentDate: string;
}

const ApplicationsPage = () => {
  const [inquiries, setInquiries] = useState<InquiryWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] =
    useState<InquiryWithProperty | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [interestRate, setInterestRate] = useState("12");
  const [downPayment, setDownPayment] = useState("");
  const [leaseDuration, setLeaseDuration] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const getSession = async () => {
      const session = await getServerSession();
      setSession(session);
    };
    getSession();
  }, []);

  const [paymentPlanData, setPaymentPlanData] = useState<PaymentPlan | null>(
    null
  );

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

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/properties");
      const data = await response.json();

      if (data.success) {
        const allInquiries: InquiryWithProperty[] = [];
        data.properties.forEach((property: Property) => {
          if (property.inquiries && property.inquiries.length > 0) {
            property.inquiries.forEach((inquiry: Inquiry) => {
              allInquiries.push({
                ...inquiry,
                propertyId: property._id,
                propertyTitle: property.title,
                propertyPrice: property.price,
                propertyLocation: property.location,
                propertyStatus: property.status,
              });
            });
          }
        });
        setInquiries(allInquiries);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filteredInquiries = inquiries
    .filter((inquiry) => {
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
    })
    .filter(
      (inquiry) =>
        inquiry.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.propertyTitle
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        inquiry.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

  const calculateLeaseTerms = () => {
    if (!selectedInquiry || !monthlyPayment || !interestRate) return;

    const propertyPrice = selectedInquiry.propertyPrice;
    const downPaymentAmount = parseFloat(downPayment) || 0;
    const monthlyPaymentAmount = parseFloat(monthlyPayment);
    const annualRate = parseFloat(interestRate) / 100;
    const monthlyRate = annualRate / 12;

    const principalAmount = propertyPrice - downPaymentAmount;

    if (principalAmount <= 0 || monthlyPaymentAmount <= 0) {
      setLeaseDuration(0);
      setTotalAmount(0);
      return;
    }

    let months = 0;
    let total = 0;

    if (monthlyRate === 0) {
      months = Math.ceil(principalAmount / monthlyPaymentAmount);
      total = downPaymentAmount + months * monthlyPaymentAmount;
    } else {
      if (monthlyPaymentAmount > principalAmount * monthlyRate) {
        months = Math.ceil(
          Math.log(1 + (principalAmount * monthlyRate) / monthlyPaymentAmount) /
            Math.log(1 + monthlyRate)
        );
        total = downPaymentAmount + months * monthlyPaymentAmount;
      } else {
        months = 0;
        total = 0;
      }
    }

    setLeaseDuration(months);
    setTotalAmount(total);
  };

  useEffect(() => {
    calculateLeaseTerms();
  }, [
    selectedInquiry,
    monthlyPayment,
    interestRate,
    downPayment,
    calculateLeaseTerms,
  ]);

  const handleApprove = async (inquiry: InquiryWithProperty) => {
    if (!monthlyPayment || leaseDuration === 0) {
      alert("Please enter valid payment details");
      return;
    }

    try {
      setProcessingId(`${inquiry.propertyId}-${inquiry.email}`);

      const propertyResponse = await fetch(
        `/api/properties/${inquiry.propertyId}`
      );
      const propertyData = await propertyResponse.json();

      if (!propertyData.success) {
        throw new Error("Failed to fetch property details");
      }

      const currentProperty = propertyData.property;

      const paymentResponse = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(monthlyPayment) * 100,
          currency: "PHP",
          description: `Monthly lease payment for ${inquiry.propertyTitle}`,
          customer: {
            name: inquiry.fullName,
            email: inquiry.email,
            phone: inquiry.phone,
          },
          propertyId: inquiry.propertyId,
          paymentPlan: {
            propertyPrice: inquiry.propertyPrice,
            downPayment: parseFloat(downPayment) || 0,
            monthlyPayment: parseFloat(monthlyPayment),
            interestRate: parseFloat(interestRate),
            leaseDuration: leaseDuration,
            totalAmount: totalAmount,
          },
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error("Failed to create payment plan");
      }

      const updatedInquiries = currentProperty.inquiries.map((inq: Inquiry) => {
        if (inq.email === inquiry.email && inq.phone === inquiry.phone) {
          return { ...inq, status: "approved" };
        }
        return inq;
      });

      const updateResponse = await fetch(
        `/api/properties/${inquiry.propertyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: currentProperty.title,
            location: currentProperty.location,
            size: currentProperty.size,
            price: currentProperty.price,
            type: currentProperty.type,
            status: "LEASED",
            description: currentProperty.description,
            amenities: currentProperty.amenities,
            images: currentProperty.images,
            sqft: currentProperty.sqft,
            inquiries: updatedInquiries,
            owner_details: {
              fullName: inquiry.fullName,
              email: inquiry.email,
              phone: inquiry.phone,
              paymentStatus: "pending",
              paymentMethod: "installment",
              paymentPlan: {
                propertyPrice: inquiry.propertyPrice,
                downPayment: parseFloat(downPayment) || 0,
                monthlyPayment: parseFloat(monthlyPayment),
                interestRate: parseFloat(interestRate),
                leaseDuration: leaseDuration,
                totalAmount: totalAmount,
                startDate: new Date().toISOString(),
                paymentPlanId: paymentData.paymentPlanId,
              },
            },
          }),
        }
      );

      const updateData = await updateResponse.json();

      if (updateData.success) {
        await fetchInquiries();
        resetPaymentModal();
        alert("Inquiry approved and payment plan created successfully!");
      } else {
        console.error("Property update failed:", updateData);
        throw new Error(updateData.error || "Failed to update property");
      }
    } catch (error) {
      console.error("Error approving inquiry:", error);
      alert(
        `Failed to approve inquiry: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setProcessingId(null);
    }
  };

  const resetPaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInquiry(null);
    setMonthlyPayment("");
    setInterestRate("12");
    setDownPayment("");
    setLeaseDuration(0);
    setTotalAmount(0);
  };

  const handleReject = async () => {
    if (!selectedInquiry || !rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setProcessingId(`${selectedInquiry.propertyId}-${selectedInquiry.email}`);

      const response = await fetch(
        `/api/properties/${selectedInquiry.propertyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inquiry: {
              ...selectedInquiry,
              status: "rejected",
              rejectionReason: rejectionReason.trim(),
            },
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchInquiries();
        setShowRejectModal(false);
        setSelectedInquiry(null);
        setRejectionReason("");
        alert("Inquiry rejected successfully!");
      }
    } catch (error) {
      console.error("Error rejecting inquiry:", error);
      alert("Failed to reject inquiry. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const clearRejectedInquiries = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all rejected inquiries? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const rejectedInquiries = inquiries.filter(
        (inq) => inq.status === "rejected"
      );

      for (const inquiry of rejectedInquiries) {
        await fetch(`/api/properties/${inquiry.propertyId}/inquiries`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: inquiry.email,
          }),
        });
      }

      await fetchInquiries();
      alert("All rejected inquiries have been cleared!");
    } catch (error) {
      console.error("Error clearing rejected inquiries:", error);
      alert("Failed to clear rejected inquiries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      <Container size="xl" py="xl">
        <Center style={{ height: 400 }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  const stats = {
    totalApplications: inquiries.length,
    pendingApplications: inquiries.filter(
      (inq) => inq.status === "pending" && inq.propertyStatus !== "LEASED"
    ).length,
    approvedApplications: inquiries.filter(
      (inq) => inq.status === "approved" || inq.propertyStatus === "LEASED"
    ).length,
    rejectedApplications: inquiries.filter((inq) => inq.status === "rejected")
      .length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Property Applications
              </h1>
              <p className="text-gray-600 mt-2">
                Monitor and manage property inquiries
              </p>
            </div>
            <button
              onClick={fetchInquiries}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">
                  Total Applications
                </p>
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
              </div>
              <div className="h-12 w-12 bg-blue-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-100">Pending</p>
                <p className="text-2xl font-bold">
                  {stats.pendingApplications}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">
                  Approved/Leased
                </p>
                <p className="text-2xl font-bold">
                  {stats.approvedApplications}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <Check className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-100">Rejected</p>
                <p className="text-2xl font-bold">
                  {stats.rejectedApplications}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <X className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Alert */}
        {stats.pendingApplications > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Pending Applications Alert
                </h3>
                <p className="text-sm text-yellow-700">
                  You have {stats.pendingApplications} pending application
                  {stats.pendingApplications > 1 ? "s" : ""} requiring review.
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
              <button
                onClick={clearRejectedInquiries}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                disabled={!inquiries.some((inq) => inq.status === "rejected")}
              >
                <Trash2 className="w-4 h-4" />
                Clear Rejected
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search applicants or properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
              />
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
                    Applicant
                  </th>
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
                      colSpan={5}
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
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Image
                              className="h-10 w-10 rounded-full object-cover"
                              src={session?.user.image || "/placeholder.png"}
                              alt="User Image"
                              width={40}
                              height={40}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {inquiry.fullName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {inquiry.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {inquiry.phone}
                            </div>
                          </div>
                        </div>
                      </td>
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
                          {formatCurrency(inquiry.propertyPrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(inquiry.submittedAt)}
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
                        <div className="flex gap-2">
                          {inquiry.status === "pending" &&
                            inquiry.propertyStatus !== "LEASED" && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedInquiry(inquiry);
                                    setShowPaymentModal(true);
                                  }}
                                  disabled={
                                    processingId ===
                                    `${inquiry.propertyId}-${inquiry.email}`
                                  }
                                  className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Check className="h-4 w-4" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedInquiry(inquiry);
                                    setShowRejectModal(true);
                                  }}
                                  disabled={
                                    processingId ===
                                    `${inquiry.propertyId}-${inquiry.email}`
                                  }
                                  className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 flex items-center gap-1 disabled:opacity-50"
                                >
                                  <X className="h-4 w-4" />
                                  Reject
                                </button>
                              </>
                            )}
                          {(inquiry.status === "approved" ||
                            inquiry.propertyStatus === "LEASED") && (
                            <button
                              disabled
                              className="bg-gray-400 text-white px-3 py-1 rounded-md cursor-not-allowed flex items-center gap-1 opacity-50"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </button>
                          )}
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
                        </div>
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
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Application Details
              </h3>

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

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
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
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Application Date
                    </p>
                    <p className="font-medium text-gray-900">
                      {formatDate(selectedInquiry.submittedAt)}
                    </p>
                  </div>
                </div>
              </div>

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
                      {formatCurrency(selectedInquiry.propertyPrice)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Reason for Application
                </h4>
                <p className="text-gray-700">{selectedInquiry.reason}</p>
              </div>

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

              {(selectedInquiry.status === "approved" ||
                selectedInquiry.propertyStatus === "LEASED") &&
                paymentPlanData && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Plan Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-600 mb-1">
                          Property Price
                        </p>
                        <p className="font-medium text-blue-900">
                          {formatCurrency(paymentPlanData.propertyPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">
                          Down Payment
                        </p>
                        <p className="font-medium text-blue-900">
                          {formatCurrency(paymentPlanData.downPayment)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">
                          Monthly Payment
                        </p>
                        <p className="font-medium text-blue-900">
                          {formatCurrency(paymentPlanData.monthlyPayment)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">
                          Interest Rate
                        </p>
                        <p className="font-medium text-blue-900">
                          {paymentPlanData.interestRate}% per annum
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">
                          Lease Duration
                        </p>
                        <p className="font-medium text-blue-900">
                          {paymentPlanData.leaseDuration} months
                          <span className="text-sm text-blue-600">
                            ({Math.floor(paymentPlanData.leaseDuration / 12)}{" "}
                            years {paymentPlanData.leaseDuration % 12} months)
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">
                          Total Amount
                        </p>
                        <p className="font-medium text-blue-900">
                          {formatCurrency(paymentPlanData.totalAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">Start Date</p>
                        <p className="font-medium text-blue-900">
                          {formatDate(paymentPlanData.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">
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
                        <p className="text-sm text-blue-600 mb-1">
                          Current Month
                        </p>
                        <p className="font-medium text-blue-900">
                          {paymentPlanData.currentMonth} of{" "}
                          {paymentPlanData.leaseDuration}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">
                          Remaining Balance
                        </p>
                        <p className="font-medium text-blue-900">
                          {formatCurrency(paymentPlanData.remainingBalance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">
                          Next Payment Date
                        </p>
                        <p className="font-medium text-blue-900">
                          {formatDate(paymentPlanData.nextPaymentDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">
                          Total Interest
                        </p>
                        <p className="font-medium text-orange-600">
                          {formatCurrency(
                            paymentPlanData.totalAmount -
                              paymentPlanData.propertyPrice
                          )}
                        </p>
                      </div>
                    </div>
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

        {/* Payment Modal */}
        {showPaymentModal && selectedInquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Create Payment Plan
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Property & Applicant Info
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Property Title</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.propertyTitle}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.propertyLocation}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">Price</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(selectedInquiry.propertyPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Applicant Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.fullName}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.email}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">
                      {selectedInquiry.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Payment Configuration
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Down Payment (₱){" "}
                      <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                      max={selectedInquiry.propertyPrice}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Payment (₱){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={monthlyPayment}
                      onChange={(e) => setMonthlyPayment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter monthly payment"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Interest Rate (%){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12"
                      min="0"
                      max="50"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Common rates: 8-15% for property financing
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Calculated Terms
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Property Price:
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(selectedInquiry.propertyPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Down Payment:
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(parseFloat(downPayment) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Principal Amount:
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(
                          selectedInquiry.propertyPrice -
                            (parseFloat(downPayment) || 0)
                        )}
                      </span>
                    </div>
                    <hr className="border-blue-200" />
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Lease Duration:
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {leaseDuration > 0 ? (
                          <>
                            {leaseDuration} months
                            <span className="text-xs">
                              ({Math.floor(leaseDuration / 12)} years{" "}
                              {leaseDuration % 12} months)
                            </span>
                          </>
                        ) : (
                          "Invalid payment"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Monthly Payment:
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {formatCurrency(parseFloat(monthlyPayment) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Amount:
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Interest:
                      </span>
                      <span className="text-sm font-medium text-orange-600">
                        {formatCurrency(
                          totalAmount - selectedInquiry.propertyPrice
                        )}
                      </span>
                    </div>
                  </div>
                  {leaseDuration === 0 && monthlyPayment && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Monthly payment is too low to cover interest. Please
                        increase the payment amount.
                      </p>
                    </div>
                  )}
                  {leaseDuration > 600 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Lease duration is very long (
                        {Math.floor(leaseDuration / 12)} years). Consider
                        increasing monthly payment.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedInquiry && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Quick Payment Options
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { years: 5, label: "5 Years" },
                      { years: 10, label: "10 Years" },
                      { years: 15, label: "15 Years" },
                    ].map((option) => {
                      const principal =
                        selectedInquiry.propertyPrice -
                        (parseFloat(downPayment) || 0);
                      const monthlyRate = parseFloat(interestRate) / 100 / 12;
                      const months = option.years * 12;
                      let suggestedPayment = 0;

                      if (monthlyRate === 0) {
                        suggestedPayment = principal / months;
                      } else {
                        suggestedPayment =
                          (principal *
                            (monthlyRate * Math.pow(1 + monthlyRate, months))) /
                          (Math.pow(1 + monthlyRate, months) - 1);
                      }

                      return (
                        <button
                          key={option.years}
                          onClick={() =>
                            setMonthlyPayment(suggestedPayment.toFixed(2))
                          }
                          className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(suggestedPayment)} / month
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedInquiry)}
                  disabled={
                    !monthlyPayment ||
                    leaseDuration === 0 ||
                    processingId ===
                      `${selectedInquiry.propertyId}-${selectedInquiry.email}`
                  }
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  <CreditCard className="h-4 w-4" />
                  {processingId ===
                  `${selectedInquiry.propertyId}-${selectedInquiry.email}`
                    ? "Processing..."
                    : "Approve & Create Payment Plan"}
                </button>
                <button
                  onClick={resetPaymentModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedInquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject Application
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Rejecting application from{" "}
                <strong>{selectedInquiry.fullName}</strong> for property{" "}
                <strong>{selectedInquiry.propertyTitle}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please provide a reason for rejection..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={
                    !rejectionReason.trim() ||
                    processingId ===
                      `${selectedInquiry.propertyId}-${selectedInquiry.email}`
                  }
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedInquiry(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;
