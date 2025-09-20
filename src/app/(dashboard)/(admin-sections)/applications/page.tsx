"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  Card,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Grid,
  TextInput,
  Select,
  Modal,
  ActionIcon,
  Alert,
  Paper,
  Textarea,
  NumberInput,
  Divider,
} from "@mantine/core";
import {
  IconSearch,
  IconFilter,
  IconCheck,
  IconX,
  IconEye,
  IconPhone,
  IconMail,
  IconMapPin,
  IconClock,
  IconInfoCircle,
  IconCalculator,
} from "@tabler/icons-react";
import { Check, X } from "lucide-react";
import axios from "axios";

// API Interfaces
export interface CreatePropertyInquiryRequest {
  fullName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  currentAddress: string;
  preferredContactMethod: "phone" | "email" | "text";
  preferredContactTime: string;
  selectedPropertyId?: string;
  specificLotUnit?: string;
  propertyType:
    | "residential-lot"
    | "commercial"
    | "house-and-lot"
    | "condo"
    | "other";
  budgetRange: string;
  preferredLotSize?: string;
  timeline:
    | "immediate"
    | "1-3-months"
    | "3-6-months"
    | "6-12-months"
    | "flexible";
  paymentMethod: "cash" | "financing" | "installment";
  additionalRequirements?: string;
  rejectionReason?: string;
}

export interface CreatePropertyLeaseRequest {
  inquiryId: string;
  propertyId: string;
  leasePlan: {
    id: string;
    name: string;
    duration: number;
    monthlyRate: number;
    totalAmount: number;
    interestRate: number;
    features: string[];
    recommended?: boolean;
  };
  propertyDetails: {
    title: string;
    location: string;
    price: string;
    type: string;
    size?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    amenities?: string[];
    description?: string;
  };
  ownerDetails: {
    fullName: string;
    email: string;
    primaryPhone: string;
    secondaryPhone?: string;
    currentAddress: string;
    userId: string;
  };
  leaseTerms: {
    startDate: Date;
    endDate: Date;
    securityDeposit?: number;
    paymentDueDate: number;
    lateFeeAmount?: number;
    gracePeriodDays?: number;
  };
}

export interface PropertyInquiry extends CreatePropertyInquiryRequest {
  _id: string;
  status:
    | "new"
    | "contacted"
    | "viewing-scheduled"
    | "negotiating"
    | "closed"
    | "rejected"
    | "owned";
  rejectionReason?: string;
  priority: "high" | "medium" | "low";
  submittedAt: Date;
  created_by: string;
  created_at: Date;
  updated_at?: Date;
  property?: {
    _id: string;
    title: string;
    location: string;
    price: string;
    type: string;
    size?: string;
    images?: string[];
    amenities?: string[];
    description?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    status?: "available" | "reserved" | "sold" | "rented" | "owned";
    availability_status?: string;
  };
  tenant?: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface CreatePropertyRequest {
  title: string;
  location: string;
  price: string;
  type: string;
  size?: string;
  images?: string[];
  amenities?: string[];
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  status: "available" | "reserved" | "sold" | "rented" | "owned";
  availability_status?: string;
  owner_details?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface GetInquiriesParams {
  status?: string;
  priority?: string;
  propertyType?: string;
  limit?: number;
  page?: number;
}

interface PropertyLease {
  _id: string;
  inquiryId: string;
  propertyId: string;
  leasePlan: CreatePropertyLeaseRequest["leasePlan"];
  propertyDetails: CreatePropertyLeaseRequest["propertyDetails"];
  ownerDetails: CreatePropertyLeaseRequest["ownerDetails"];
  leaseTerms: CreatePropertyLeaseRequest["leaseTerms"];
  status: "active" | "completed" | "terminated" | "pending";
  paymentHistory: Array<{
    month: number;
    year: number;
    amount: number;
    paidDate?: Date;
    status: "pending" | "paid" | "overdue";
    lateFee?: number;
  }>;
  created_by: string;
  created_at: Date;
  updated_at?: Date;
}

// API Client Classes
class PropertyInquiriesApi {
  private baseUrl = "/api/property-inquiries";

  async create(
    data: CreatePropertyInquiryRequest
  ): Promise<ApiResponse<PropertyInquiry>> {
    try {
      const response = await axios.post(this.baseUrl, data);
      return {
        success: true,
        data: response.data.inquiry,
        message: response.data.message || "Inquiry submitted successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to submit inquiry",
        };
      }
      console.error("Error creating property inquiry:", error);
      return {
        success: false,
        error: "Network error occurred while submitting inquiry",
      };
    }
  }

  async getAll(
    params: GetInquiriesParams = {}
  ): Promise<
    ApiResponse<{ inquiries: PropertyInquiry[]; pagination: PaginationInfo }>
  > {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          ...(params.status && { status: params.status }),
          ...(params.priority && { priority: params.priority }),
          ...(params.propertyType && { propertyType: params.propertyType }),
          ...(params.limit && { limit: params.limit }),
          ...(params.page && { page: params.page }),
        },
      });

      return {
        success: true,
        data: {
          inquiries: response.data.inquiries,
          pagination: response.data.pagination,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to fetch inquiries",
        };
      }
      console.error("Error fetching property inquiries:", error);
      return {
        success: false,
        error: "Network error occurred while fetching inquiries",
      };
    }
  }

  async getById(id: string): Promise<ApiResponse<PropertyInquiry>> {
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`);
      return {
        success: true,
        data: response.data.inquiry,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to fetch inquiry",
        };
      }
      console.error("Error fetching property inquiry:", error);
      return {
        success: false,
        error: "Network error occurred while fetching inquiry",
      };
    }
  }

  async update(
    id: string,
    data: Partial<CreatePropertyInquiryRequest> & {
      status?: PropertyInquiry["status"];
      priority?: PropertyInquiry["priority"];
    }
  ): Promise<ApiResponse<PropertyInquiry>> {
    try {
      const response = await axios.put(`${this.baseUrl}/${id}`, data);
      return {
        success: true,
        data: response.data.inquiry,
        message: response.data.message || "Inquiry updated successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to update inquiry",
        };
      }
      console.error("Error updating property inquiry:", error);
      return {
        success: false,
        error: "Network error occurred while updating inquiry",
      };
    }
  }

  async delete(id: string): Promise<ApiResponse> {
    try {
      const response = await axios.delete(`${this.baseUrl}/${id}`);
      return {
        success: true,
        message: response.data.message || "Inquiry deleted successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to delete inquiry",
        };
      }
      console.error("Error deleting property inquiry:", error);
      return {
        success: false,
        error: "Network error occurred while deleting inquiry",
      };
    }
  }

  async updateStatus(
    id: string,
    status: PropertyInquiry["status"]
  ): Promise<ApiResponse<PropertyInquiry>> {
    return this.update(id, { status });
  }

  async updatePriority(
    id: string,
    priority: PropertyInquiry["priority"]
  ): Promise<ApiResponse<PropertyInquiry>> {
    return this.update(id, { priority });
  }
}

class PropertiesApi {
  private baseUrl = "/api/properties";

  async getAll(
    params: Record<string, unknown> = {}
  ): Promise<ApiResponse<Property[]>> {
    try {
      const response = await axios.get(this.baseUrl, { params });
      return {
        success: true,
        data: response.data.properties,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to fetch properties",
        };
      }
      console.error("Error fetching properties:", error);
      return {
        success: false,
        error: "Network error occurred while fetching properties",
      };
    }
  }

  async update(
    id: string,
    data: Partial<CreatePropertyRequest>
  ): Promise<ApiResponse<Property>> {
    try {
      const response = await axios.put(`${this.baseUrl}/${id}`, data);
      return {
        success: true,
        data: response.data.property,
        message: response.data.message || "Property updated successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to update property",
        };
      }
      console.error("Error updating property:", error);
      return {
        success: false,
        error: "Network error occurred while updating property",
      };
    }
  }
}

class PropertyLeasesApi {
  private baseUrl = "/api/property-leases";

  async create(
    data: CreatePropertyLeaseRequest
  ): Promise<ApiResponse<PropertyLease>> {
    try {
      const response = await axios.post(this.baseUrl, data);
      return {
        success: true,
        data: response.data.lease,
        message: response.data.message || "Property lease created successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to create property lease",
        };
      }
      console.error("Error creating property lease:", error);
      return {
        success: false,
        error: "Network error occurred while creating property lease",
      };
    }
  }

  async getAll(
    params: Record<string, unknown> = {}
  ): Promise<ApiResponse<PropertyLease[]>> {
    try {
      const response = await axios.get(this.baseUrl, { params });
      return {
        success: true,
        data: response.data.leases,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to fetch property leases",
        };
      }
      console.error("Error fetching property leases:", error);
      return {
        success: false,
        error: "Network error occurred while fetching property leases",
      };
    }
  }
}

// Create API instances
const propertyInquiriesApi = new PropertyInquiriesApi();
const propertiesApi = new PropertiesApi();
const propertyLeasesApi = new PropertyLeasesApi();

// Component Interfaces
interface Property {
  _id: string;
  title: string;
  location: string;
  price: string;
  type: string;
  size?: string;
  images?: string[];
  amenities?: string[];
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  status: "available" | "reserved" | "sold" | "rented" | "owned";
  availability_status?: string;
  owner_details?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
}

interface LeasePlan {
  id: string;
  name: string;
  duration: string;
  monthlyRate: string;
  totalAmount: string;
  interestRate?: string;
  features: string[];
  recommended?: boolean;
}

interface CustomLeasePlan {
  id: string;
  name: string;
  duration: number;
  monthlyRate: number;
  totalAmount: number;
  interestRate: number;
  features: string[];
  recommended?: boolean;
}

type DisplayStatus = "pending" | "approved" | "rejected" | "owned";

interface PropertyInquiryUI {
  _id: string;
  id: string;
  fullName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  currentAddress: string;
  preferredContactMethod: "phone" | "email" | "text";
  preferredContactTime: string;
  selectedPropertyId?: string;
  specificLotUnit?: string;
  propertyType:
    | "residential-lot"
    | "commercial"
    | "house-and-lot"
    | "condo"
    | "other";
  budgetRange: string;
  preferredLotSize?: string;
  timeline:
    | "immediate"
    | "1-3-months"
    | "3-6-months"
    | "6-12-months"
    | "flexible";
  paymentMethod: "cash" | "financing" | "installment";
  additionalRequirements?: string;
  status:
    | "new"
    | "contacted"
    | "viewing-scheduled"
    | "negotiating"
    | "closed"
    | "rejected"
    | "owned";
  displayStatus: DisplayStatus;
  rejectionReason?: string;
  priority: "high" | "medium" | "low";
  created_by: string;
  created_at: string | Date;
  updated_at?: string | Date;
  submittedAt: string | Date;
  approvedAt?: string;
  property?: {
    _id: string;
    title: string;
    location: string;
    price: string;
    type: string;
    size?: string;
    images?: string[];
    amenities?: string[];
    description?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    status?: "available" | "reserved" | "sold" | "rented" | "owned";
    availability_status?: string;
  };
  tenant?: {
    fullName: string;
    email: string;
    phone: string;
  };
  propertyTitle?: string;
  propertyPrice?: string;
  propertyLocation?: string;
  propertyImage?: string;
  selectedLeasePlan?: CreatePropertyLeaseRequest["leasePlan"];
  propertyLease?: PropertyLease;
}

const ApplicationsSection = () => {
  const [inquiries, setInquiries] = useState<PropertyInquiryUI[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] =
    useState<PropertyInquiryUI | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [inquiryToReject, setInquiryToReject] = useState<string | null>(null);
  const [clearAllLoading, setClearAllLoading] = useState(false);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [planSelectionModalOpen, setPlanSelectionModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CustomLeasePlan | null>(
    null
  );
  const [inquiryToApprove, setInquiryToApprove] = useState<string | null>(null);
  const [customMonthlyPayment, setCustomMonthlyPayment] =
    useState<number>(5000);
  const [selectedTerm, setSelectedTerm] = useState<number>(12);
  const [interestRate, setInterestRate] = useState<number>(5);
  const [calculatedPlan, setCalculatedPlan] = useState<CustomLeasePlan | null>(
    null
  );
  const [currentPropertyPrice, setCurrentPropertyPrice] = useState<number>(0);
  const [currentInquiry, setCurrentInquiry] =
    useState<PropertyInquiryUI | null>(null);

  const parsePropertyPrice = (priceString?: string): number => {
    if (!priceString) return 0;
    const cleanPrice = priceString
      .replace(/[₱,$]/g, "")
      .replace(/,/g, "")
      .replace(/\s/g, "");
    return parseFloat(cleanPrice) || 0;
  };

  const mapApiStatusToDisplayStatus = (apiStatus: string): DisplayStatus => {
    switch (apiStatus) {
      case "new":
      case "contacted":
      case "viewing-scheduled":
      case "negotiating":
        return "pending";
      case "closed":
        return "approved";
      case "rejected":
        return "rejected";
      case "owned":
        return "owned";
      default:
        return "pending";
    }
  };

  useEffect(() => {
    fetchInquiries();
    fetchProperties();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const response = await propertyInquiriesApi.getAll({
        limit: 100,
      });

      if (response.success && response.data) {
        const mappedInquiries: PropertyInquiryUI[] =
          response.data.inquiries.map((inquiry) => ({
            ...inquiry,
            id: inquiry._id,
            displayStatus: mapApiStatusToDisplayStatus(inquiry.status),
            propertyTitle: inquiry.property?.title,
            propertyPrice: inquiry.property?.price,
            propertyLocation: inquiry.property?.location,
            propertyImage: inquiry.property?.images?.[0],
          }));
        setInquiries(mappedInquiries);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await propertiesApi.getAll();
      if (response.success && response.data) {
        setProperties(response.data);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inquiry.propertyTitle &&
        inquiry.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || inquiry.displayStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (inquiry: PropertyInquiryUI) => {
    setSelectedInquiry(inquiry);
    setDetailsModalOpen(true);
  };

  const handleApprove = async (inquiryId: string) => {
    // Find the inquiry to get property details
    const inquiry = inquiries.find((inq) => inq._id === inquiryId);
    if (!inquiry || !inquiry.property) {
      alert("Property details not found for this inquiry");
      return;
    }

    // Set the current property price and inquiry for plan selection
    const propertyPrice = parsePropertyPrice(inquiry.property.price);
    setCurrentPropertyPrice(propertyPrice);
    setCurrentInquiry(inquiry);
    setInquiryToApprove(inquiryId);

    // Generate default plan
    const defaultMonthlyPayment = Math.max(5000, propertyPrice * 0.05); // 5% of property value or minimum 5000
    calculatePlan(defaultMonthlyPayment, 12, 5, propertyPrice);
    setCustomMonthlyPayment(defaultMonthlyPayment);

    setPlanSelectionModalOpen(true);
  };

  const calculatePlan = (
    monthlyPayment: number,
    termMonths: number,
    interestRate: number,
    propertyPrice: number
  ) => {
    // Simple calculation: monthly payment * term = total amount
    // Interest is already factored into the monthly payment
    const totalAmount = monthlyPayment * termMonths;

    const plan: CustomLeasePlan = {
      id: `custom-${Date.now()}`,
      name: `Custom ${termMonths} Month Plan`,
      duration: termMonths,
      monthlyRate: monthlyPayment,
      totalAmount,
      interestRate,
      features: [
        `${termMonths} month payment term`,
        `₱${monthlyPayment.toLocaleString()} monthly payment`,
        `${interestRate}% interest rate`,
        "Flexible payment schedule",
        "Property ownership transfer upon completion",
      ],
      recommended: true,
    };

    setCalculatedPlan(plan);
  };

  const handlePlanCalculation = () => {
    calculatePlan(
      customMonthlyPayment,
      selectedTerm,
      interestRate,
      currentPropertyPrice
    );
  };

  const confirmApproval = async () => {
    if (!inquiryToApprove || !calculatedPlan || !currentInquiry) {
      alert("Missing required information for approval");
      return;
    }

    // Enhanced validation for property data
    if (!currentInquiry.property || !currentInquiry.property._id) {
      alert(
        "Property information is missing or incomplete. Cannot create lease."
      );
      console.error("Missing property data:", currentInquiry.property);
      return;
    }

    // Additional validation to ensure selectedPropertyId exists
    const propertyId =
      currentInquiry.selectedPropertyId || currentInquiry.property._id;
    if (!propertyId) {
      alert("Property ID is missing. Cannot create lease.");
      console.error("Missing property ID:", {
        selectedPropertyId: currentInquiry.selectedPropertyId,
        propertyId: currentInquiry.property._id,
        inquiry: currentInquiry,
      });
      return;
    }

    setActionLoading(inquiryToApprove);
    try {
      // Update inquiry status to closed (approved)
      const updateResponse = await propertyInquiriesApi.updateStatus(
        inquiryToApprove,
        "closed"
      );

      if (!updateResponse.success) {
        throw new Error(
          updateResponse.error || "Failed to update inquiry status"
        );
      }

      // Create property lease with the selected plan
      const leaseData: CreatePropertyLeaseRequest = {
        inquiryId: inquiryToApprove,
        propertyId: propertyId, // Use the validated property ID
        leasePlan: calculatedPlan,
        propertyDetails: {
          title: currentInquiry.property.title,
          location: currentInquiry.property.location,
          price: currentInquiry.property.price,
          type: currentInquiry.property.type,
          size: currentInquiry.property.size,
          bedrooms: currentInquiry.property.bedrooms,
          bathrooms: currentInquiry.property.bathrooms,
          sqft: currentInquiry.property.sqft,
          amenities: currentInquiry.property.amenities,
          description: currentInquiry.property.description,
        },
        ownerDetails: {
          fullName: currentInquiry.fullName,
          email: currentInquiry.email,
          primaryPhone: currentInquiry.primaryPhone,
          secondaryPhone: currentInquiry.secondaryPhone,
          currentAddress: currentInquiry.currentAddress,
          userId: currentInquiry.created_by,
        },
        leaseTerms: {
          startDate: new Date(),
          endDate: new Date(
            Date.now() + calculatedPlan.duration * 30 * 24 * 60 * 60 * 1000
          ), // Approximate end date
          securityDeposit: calculatedPlan.monthlyRate, // One month security deposit
          paymentDueDate: 1, // 1st of each month
          lateFeeAmount: 500, // Default late fee
          gracePeriodDays: 5, // 5 day grace period
        },
      };

      console.log(
        "Creating lease with data:",
        JSON.stringify(leaseData, null, 2)
      );

      const leaseResponse = await propertyLeasesApi.create(leaseData);

      if (!leaseResponse.success) {
        throw new Error(
          leaseResponse.error || "Failed to create property lease"
        );
      }

      // Update property status to owned
      if (currentInquiry.property) {
        await propertiesApi.update(currentInquiry.property._id, {
          status: "owned",
          availability_status: "owned",
        });
      }

      // Refresh inquiries
      await fetchInquiries();

      // Close modals and reset state
      setPlanSelectionModalOpen(false);
      setInquiryToApprove(null);
      setCurrentInquiry(null);
      setCalculatedPlan(null);

      alert("Application approved and lease created successfully!");
    } catch (error) {
      console.error("Error approving application:", error);
      alert(
        error instanceof Error ? error.message : "Failed to approve application"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (inquiryId: string) => {
    setInquiryToReject(inquiryId);
    setRejectModalOpen(true);
  };

  const confirmRejection = async () => {
    if (!inquiryToReject || !rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setActionLoading(inquiryToReject);
    try {
      const response = await propertyInquiriesApi.update(inquiryToReject, {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
      });

      if (response.success) {
        await fetchInquiries();
        setRejectModalOpen(false);
        setInquiryToReject(null);
        setRejectionReason("");
        alert("Application rejected successfully!");
      } else {
        throw new Error(response.error || "Failed to reject application");
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert("Failed to reject application");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearAll = async () => {
    setClearAllLoading(true);
    try {
      const rejectedInquiries = inquiries.filter(
        (inquiry) => inquiry.displayStatus === "rejected"
      );

      await Promise.all(
        rejectedInquiries.map((inquiry) =>
          propertyInquiriesApi.delete(inquiry._id)
        )
      );

      await fetchInquiries();
      setClearAllModalOpen(false);
      alert("All rejected applications cleared successfully!");
    } catch (error) {
      console.error("Error clearing applications:", error);
      alert("Failed to clear applications");
    } finally {
      setClearAllLoading(false);
    }
  };

  const getStatusColor = (status: DisplayStatus) => {
    switch (status) {
      case "pending":
        return "yellow";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "owned":
        return "blue";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <IconClock size={16} />;
      case "approved":
        return <Check size={16} />;
      case "rejected":
        return <X size={16} />;
      case "owned":
        return <IconCheck size={16} />;
      default:
        return <IconInfoCircle size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "blue";
      default:
        return "gray";
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const statusCounts = {
    all: inquiries.length,
    pending: inquiries.filter((inquiry) => inquiry.displayStatus === "pending")
      .length,
    approved: inquiries.filter(
      (inquiry) => inquiry.displayStatus === "approved"
    ).length,
    rejected: inquiries.filter(
      (inquiry) => inquiry.displayStatus === "rejected"
    ).length,
    owned: inquiries.filter((inquiry) => inquiry.displayStatus === "owned")
      .length,
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2}>Property Applications</Title>
          {inquiries.filter((inquiry) => inquiry.displayStatus === "rejected")
            .length > 0 && (
            <Button
              variant="outline"
              color="red"
              onClick={() => setClearAllModalOpen(true)}
              loading={clearAllLoading}
            >
              Clear All Rejected
            </Button>
          )}
        </Group>

        {/* Search and Filter Controls */}
        <Paper p="md" withBorder>
          <Group grow>
            <TextInput
              placeholder="Search by name, email, or property..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
            />
            <Select
              placeholder="Filter by status"
              leftSection={<IconFilter size={16} />}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || "all")}
              data={[
                { value: "all", label: `All (${statusCounts.all})` },
                {
                  value: "pending",
                  label: `Pending (${statusCounts.pending})`,
                },
                {
                  value: "approved",
                  label: `Approved (${statusCounts.approved})`,
                },
                {
                  value: "rejected",
                  label: `Rejected (${statusCounts.rejected})`,
                },
                { value: "owned", label: `Owned (${statusCounts.owned})` },
              ]}
            />
          </Group>
        </Paper>

        {/* Applications Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <Text>Loading applications...</Text>
          </div>
        ) : (
          <Grid>
            {filteredInquiries.length === 0 ? (
              <Grid.Col span={12}>
                <Paper p="xl" withBorder>
                  <Stack align="center" gap="sm">
                    <IconInfoCircle size={48} color="gray" />
                    <Text size="lg" c="dimmed">
                      No applications found
                    </Text>
                    <Text size="sm" c="dimmed">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "Applications will appear here when submitted"}
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>
            ) : (
              filteredInquiries.map((inquiry) => (
                <Grid.Col key={inquiry._id} span={{ base: 12, md: 6, lg: 4 }}>
                  <Card
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    h="100%"
                  >
                    <Stack justify="space-between" h="100%">
                      <div>
                        <Group justify="space-between" mb="xs">
                          <Badge
                            color={getStatusColor(inquiry.displayStatus)}
                            leftSection={getStatusIcon(inquiry.displayStatus)}
                            variant="filled"
                          >
                            {inquiry.displayStatus.charAt(0).toUpperCase() +
                              inquiry.displayStatus.slice(1)}
                          </Badge>
                          <Badge
                            color={getPriorityColor(inquiry.priority)}
                            variant="outline"
                            size="sm"
                          >
                            {inquiry.priority.toUpperCase()}
                          </Badge>
                        </Group>

                        <Title order={4} mb="xs" lineClamp={1}>
                          {inquiry.fullName}
                        </Title>

                        <Stack gap="xs" mb="md">
                          <Group gap="xs">
                            <IconMail size={14} />
                            <Text size="sm" c="dimmed" lineClamp={1}>
                              {inquiry.email}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <IconPhone size={14} />
                            <Text size="sm" c="dimmed">
                              {inquiry.primaryPhone}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <IconMapPin size={14} />
                            <Text size="sm" c="dimmed" lineClamp={1}>
                              {inquiry.propertyLocation ||
                                "No property selected"}
                            </Text>
                          </Group>
                        </Stack>

                        {inquiry.propertyTitle && (
                          <div>
                            <Text size="sm" fw={500} mb="xs">
                              Property: {inquiry.propertyTitle}
                            </Text>
                            <Text size="sm" c="dimmed" mb="xs">
                              {inquiry.propertyPrice}
                            </Text>
                          </div>
                        )}

                        <Text size="xs" c="dimmed">
                          Submitted: {formatDate(inquiry.submittedAt)}
                        </Text>

                        {inquiry.displayStatus === "rejected" &&
                          inquiry.rejectionReason && (
                            <Alert
                              icon={<IconInfoCircle size={16} />}
                              color="red"
                              variant="light"
                              mt="sm"
                            >
                              <Text size="xs">
                                Reason: {inquiry.rejectionReason}
                              </Text>
                            </Alert>
                          )}
                      </div>

                      <div>
                        <Divider my="sm" />
                        <Group gap="xs">
                          <Button
                            variant="light"
                            size="xs"
                            leftSection={<IconEye size={14} />}
                            onClick={() => handleViewDetails(inquiry)}
                            flex={1}
                          >
                            View
                          </Button>

                          {inquiry.displayStatus === "pending" && (
                            <>
                              <ActionIcon
                                color="green"
                                variant="filled"
                                size="lg"
                                onClick={() => handleApprove(inquiry._id)}
                                loading={actionLoading === inquiry._id}
                                disabled={!!actionLoading}
                              >
                                <IconCheck size={16} />
                              </ActionIcon>
                              <ActionIcon
                                color="red"
                                variant="filled"
                                size="lg"
                                onClick={() => handleReject(inquiry._id)}
                                loading={actionLoading === inquiry._id}
                                disabled={!!actionLoading}
                              >
                                <IconX size={16} />
                              </ActionIcon>
                            </>
                          )}
                        </Group>
                      </div>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))
            )}
          </Grid>
        )}
      </Stack>

      {/* Details Modal */}
      <Modal
        opened={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Application Details"
        size="lg"
      >
        {selectedInquiry && (
          <Stack gap="md">
            <Group justify="space-between">
              <Badge
                color={getStatusColor(selectedInquiry.displayStatus)}
                size="lg"
                leftSection={getStatusIcon(selectedInquiry.displayStatus)}
              >
                {selectedInquiry.displayStatus.charAt(0).toUpperCase() +
                  selectedInquiry.displayStatus.slice(1)}
              </Badge>
              <Badge
                color={getPriorityColor(selectedInquiry.priority)}
                variant="outline"
              >
                {selectedInquiry.priority.toUpperCase()} Priority
              </Badge>
            </Group>

            <Divider />

            <div>
              <Text fw={500} mb="xs">
                Personal Information
              </Text>
              <Stack gap="xs">
                <Group>
                  <Text size="sm" c="dimmed" w={120}>
                    Name:
                  </Text>
                  <Text size="sm">{selectedInquiry.fullName}</Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed" w={120}>
                    Email:
                  </Text>
                  <Text size="sm">{selectedInquiry.email}</Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed" w={120}>
                    Primary Phone:
                  </Text>
                  <Text size="sm">{selectedInquiry.primaryPhone}</Text>
                </Group>
                {selectedInquiry.secondaryPhone && (
                  <Group>
                    <Text size="sm" c="dimmed" w={120}>
                      Secondary Phone:
                    </Text>
                    <Text size="sm">{selectedInquiry.secondaryPhone}</Text>
                  </Group>
                )}
                <Group>
                  <Text size="sm" c="dimmed" w={120}>
                    Address:
                  </Text>
                  <Text size="sm">{selectedInquiry.currentAddress}</Text>
                </Group>
              </Stack>
            </div>

            <Divider />

            <div>
              <Text fw={500} mb="xs">
                Property Preferences
              </Text>
              <Stack gap="xs">
                <Group>
                  <Text size="sm" c="dimmed" w={120}>
                    Property Type:
                  </Text>
                  <Text size="sm">
                    {selectedInquiry.propertyType.replace("-", " ")}
                  </Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed" w={120}>
                    Budget Range:
                  </Text>
                  <Text size="sm">{selectedInquiry.budgetRange}</Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed" w={120}>
                    Timeline:
                  </Text>
                  <Text size="sm">
                    {selectedInquiry.timeline.replace("-", " ")}
                  </Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed" w={120}>
                    Payment Method:
                  </Text>
                  <Text size="sm">{selectedInquiry.paymentMethod}</Text>
                </Group>
                {selectedInquiry.preferredLotSize && (
                  <Group>
                    <Text size="sm" c="dimmed" w={120}>
                      Preferred Size:
                    </Text>
                    <Text size="sm">{selectedInquiry.preferredLotSize}</Text>
                  </Group>
                )}
                {selectedInquiry.specificLotUnit && (
                  <Group>
                    <Text size="sm" c="dimmed" w={120}>
                      Specific Unit:
                    </Text>
                    <Text size="sm">{selectedInquiry.specificLotUnit}</Text>
                  </Group>
                )}
              </Stack>
            </div>

            {selectedInquiry.property && (
              <>
                <Divider />
                <div>
                  <Text fw={500} mb="xs">
                    Selected Property
                  </Text>
                  <Stack gap="xs">
                    <Group>
                      <Text size="sm" c="dimmed" w={120}>
                        Title:
                      </Text>
                      <Text size="sm">{selectedInquiry.property.title}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" c="dimmed" w={120}>
                        Location:
                      </Text>
                      <Text size="sm">{selectedInquiry.property.location}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" c="dimmed" w={120}>
                        Price:
                      </Text>
                      <Text size="sm">{selectedInquiry.property.price}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" c="dimmed" w={120}>
                        Type:
                      </Text>
                      <Text size="sm">{selectedInquiry.property.type}</Text>
                    </Group>
                    {selectedInquiry.property.size && (
                      <Group>
                        <Text size="sm" c="dimmed" w={120}>
                          Size:
                        </Text>
                        <Text size="sm">{selectedInquiry.property.size}</Text>
                      </Group>
                    )}
                  </Stack>
                </div>
              </>
            )}

            <Divider />

            <div>
              <Text fw={500} mb="xs">
                Contact Preferences
              </Text>
              <Stack gap="xs">
                <Group>
                  <Text size="sm" c="dimmed" w={120}>
                    Method:
                  </Text>
                  <Text size="sm">
                    {selectedInquiry.preferredContactMethod}
                  </Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed" w={120}>
                    Best Time:
                  </Text>
                  <Text size="sm">{selectedInquiry.preferredContactTime}</Text>
                </Group>
              </Stack>
            </div>

            {selectedInquiry.additionalRequirements && (
              <>
                <Divider />
                <div>
                  <Text fw={500} mb="xs">
                    Additional Requirements
                  </Text>
                  <Text size="sm">
                    {selectedInquiry.additionalRequirements}
                  </Text>
                </div>
              </>
            )}

            {selectedInquiry.displayStatus === "rejected" &&
              selectedInquiry.rejectionReason && (
                <>
                  <Divider />
                  <Alert icon={<IconInfoCircle size={16} />} color="red">
                    <Text fw={500} mb="xs">
                      Rejection Reason:
                    </Text>
                    <Text size="sm">{selectedInquiry.rejectionReason}</Text>
                  </Alert>
                </>
              )}

            <Divider />

            <Group>
              <Text size="xs" c="dimmed">
                Submitted: {formatDate(selectedInquiry.submittedAt)}
              </Text>
              {selectedInquiry.updated_at && (
                <Text size="xs" c="dimmed">
                  Updated: {formatDate(selectedInquiry.updated_at)}
                </Text>
              )}
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Plan Selection Modal */}
      <Modal
        opened={planSelectionModalOpen}
        onClose={() => setPlanSelectionModalOpen(false)}
        title="Select Lease Plan"
        size="lg"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />} color="blue">
            Configure the lease plan for this property application.
          </Alert>

          <div>
            <Text fw={500} mb="xs">
              Property Price: {formatCurrency(currentPropertyPrice)}
            </Text>
          </div>

          <Divider />

          <div>
            <Text fw={500} mb="md">
              Plan Configuration
            </Text>
            <Stack gap="md">
              <NumberInput
                label="Monthly Payment"
                placeholder="Enter monthly payment amount"
                value={customMonthlyPayment}
                onChange={(value) => setCustomMonthlyPayment(Number(value))}
                min={1000}
                max={currentPropertyPrice}
                step={500}
                leftSection="₱"
                thousandSeparator=","
              />

              <Select
                label="Payment Term"
                value={selectedTerm.toString()}
                onChange={(value) => setSelectedTerm(Number(value))}
                data={[
                  { value: "6", label: "6 months" },
                  { value: "12", label: "12 months" },
                  { value: "18", label: "18 months" },
                  { value: "24", label: "24 months" },
                  { value: "36", label: "36 months" },
                  { value: "48", label: "48 months" },
                  { value: "60", label: "60 months" },
                ]}
              />

              <NumberInput
                label="Interest Rate (%)"
                value={interestRate}
                onChange={(value) => setInterestRate(Number(value))}
                min={0}
                max={20}
                step={0.5}
                decimalScale={1}
                suffix="%"
              />

              <Button
                leftSection={<IconCalculator size={16} />}
                onClick={handlePlanCalculation}
                variant="light"
              >
                Calculate Plan
              </Button>
            </Stack>
          </div>

          {calculatedPlan && (
            <>
              <Divider />
              <div>
                <Text fw={500} mb="md">
                  Calculated Plan
                </Text>
                <Card withBorder padding="md">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text fw={500}>{calculatedPlan.name}</Text>
                      <Badge color="green" variant="filled">
                        Recommended
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Monthly Payment:
                      </Text>
                      <Text fw={500}>
                        {formatCurrency(calculatedPlan.monthlyRate)}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Term:
                      </Text>
                      <Text>{calculatedPlan.duration} months</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Total Amount:
                      </Text>
                      <Text fw={500}>
                        {formatCurrency(calculatedPlan.totalAmount)}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Interest Rate:
                      </Text>
                      <Text>{calculatedPlan.interestRate}%</Text>
                    </Group>
                    <Divider />
                    <div>
                      <Text size="sm" c="dimmed" mb="xs">
                        Features:
                      </Text>
                      <Stack gap={4}>
                        {calculatedPlan.features.map((feature, index) => (
                          <Text key={index} size="xs" c="dimmed">
                            • {feature}
                          </Text>
                        ))}
                      </Stack>
                    </div>
                  </Stack>
                </Card>
              </div>
            </>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => setPlanSelectionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApproval}
              disabled={!calculatedPlan}
              loading={actionLoading === inquiryToApprove}
            >
              Approve with Plan
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        opened={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Application"
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />} color="red">
            Please provide a reason for rejecting this application.
          </Alert>

          <Textarea
            label="Rejection Reason"
            placeholder="Enter the reason for rejection..."
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.currentTarget.value)}
            minRows={3}
            required
          />

          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={confirmRejection}
              disabled={!rejectionReason.trim()}
              loading={actionLoading === inquiryToReject}
            >
              Reject Application
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Clear All Rejected Modal */}
      <Modal
        opened={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        title="Clear All Rejected Applications"
        size="sm"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />} color="red">
            Are you sure you want to permanently delete all rejected
            applications? This action cannot be undone.
          </Alert>

          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => setClearAllModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleClearAll}
              loading={clearAllLoading}
            >
              Clear All Rejected
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default ApplicationsSection;
