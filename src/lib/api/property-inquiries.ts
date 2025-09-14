// lib/api/property-inquiries.ts

import axios, { AxiosResponse } from "axios";

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

// Updated to include 'rejected' status
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
    _id: string; // Added _id field
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

// Add CreatePropertyRequest interface for property API
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

// Define pagination interface
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

class PropertyInquiriesApi {
  private baseUrl = "/api/property-inquiries";

  async create(
    data: CreatePropertyInquiryRequest
  ): Promise<ApiResponse<PropertyInquiry>> {
    try {
      const response: AxiosResponse = await axios.post(this.baseUrl, data);

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
      const response: AxiosResponse = await axios.get(this.baseUrl, {
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
      const response: AxiosResponse = await axios.get(`${this.baseUrl}/${id}`);

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
      const response: AxiosResponse = await axios.put(
        `${this.baseUrl}/${id}`,
        data
      );

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
      const response: AxiosResponse = await axios.delete(
        `${this.baseUrl}/${id}`
      );

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

export const propertyInquiriesApi = new PropertyInquiriesApi();
