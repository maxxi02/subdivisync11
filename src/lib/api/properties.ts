import axios, { AxiosResponse } from "axios";
import { ApiResponse } from "./payments";

interface PropertyOwner {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentStatus?: "paid" | "partial" | "pending" | "overdue" | "defaulted";
  paymentMethod?: "cash" | "bank_transfer" | "check" | "online";
  monthlyRent?: number;
  leaseStartDate?: string; // ISO date string
  leaseEndDate?: string; // ISO date string
  paymentDueDay?: number; // Day of month (1-31)
  lastPaymentDate?: string; // ISO date string
  nextPaymentDue?: string; // ISO date string
}

export interface Property {
  _id: string;
  title: string;
  location: string;
  size: string;
  price: number;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "CREATED" | "UNDER_INQUIRY" | "APPROVED" | "REJECTED" | "LEASED";
  images?: string[];
  amenities: string[];
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  owner?: PropertyOwner;
}

export interface CreatePropertyRequest {
  title: string;
  location: string;
  size: string;
  price: string; // String in request, converted to number on server
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "CREATED" | "UNDER_INQUIRY" | "APPROVED" | "REJECTED" | "LEASED";
  images?: string[];
  amenities?: string[];
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  owner_details?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    paymentStatus?: "paid" | "partial" | "pending" | "overdue" | "defaulted";
    paymentMethod?: "cash" | "bank_transfer" | "check" | "online";
    monthlyRent?: number;
    leaseStartDate?: string;
    leaseEndDate?: string;
    paymentDueDay?: number;
    lastPaymentDate?: string;
    nextPaymentDue?: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface PropertiesResponse {
  success: boolean;
  properties: Property[];
  pagination?: Pagination;
  error?: string;
}

const baseUrl = "/api/properties";

export const propertiesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }): Promise<PropertiesResponse> => {
    try {
      const response: AxiosResponse<PropertiesResponse> = await axios.get(
        baseUrl,
        { params }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          properties: [],
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to fetch properties",
        };
      }
      console.error("Error fetching properties:", error);
      return {
        success: false,
        properties: [],
        error: "Network error occurred while fetching properties",
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Property>> => {
    try {
      const response: AxiosResponse = await axios.get(`${baseUrl}/${id}`);
      return {
        success: true,
        data: response.data.property,
        message: response.data.message || "Property fetched successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to fetch property",
        };
      }
      console.error("Error fetching property:", error);
      return {
        success: false,
        error: "Network error occurred while fetching property",
      };
    }
  },

  create: async (
    data: CreatePropertyRequest
  ): Promise<ApiResponse<Property>> => {
    try {
      const response: AxiosResponse = await axios.post(baseUrl, data);
      return {
        success: true,
        data: response.data.property,
        message: response.data.message || "Property created successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to create property",
        };
      }
      console.error("Error creating property:", error);
      return {
        success: false,
        error: "Network error occurred while creating property",
      };
    }
  },

  update: async (
    id: string,
    data: Partial<CreatePropertyRequest>
  ): Promise<ApiResponse<Property>> => {
    try {
      const response: AxiosResponse = await axios.put(`${baseUrl}/${id}`, data);
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
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const response: AxiosResponse = await axios.delete(`${baseUrl}/${id}`);
      return {
        success: true,
        data: null,
        message: response.data.message || "Property deleted successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to delete property",
        };
      }
      console.error("Error deleting property:", error);
      return {
        success: false,
        error: "Network error occurred while deleting property",
      };
    }
  },

  makePayment: async (transactionId: string): Promise<ApiResponse<null>> => {
    try {
      const response: AxiosResponse = await axios.post(
        `/api/transactions/${transactionId}/pay`
      );
      return {
        success: true,
        data: null,
        message: response.data.message || "Payment processed successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to process payment",
        };
      }
      console.error("Error processing payment:", error);
      return {
        success: false,
        error: "Network error occurred while processing payment",
      };
    }
  },
};
