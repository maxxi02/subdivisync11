// lib/api/approved-properties.ts
import axios from "axios";
import { CreatePropertyRequest } from "./properties";

export interface PropertyOwner {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  approvedDate: string;
  paymentMethod: "cash" | "financing" | "installment";
  paymentStatus: "paid" | "partial" | "pending";
}

export interface ApprovedProperty {
  _id?: string;
  title: string;
  location: string;
  size: string;
  price: string;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "rented" | "sold" | "reserved";
  approvedDate: string;
  image: string;
  owner: PropertyOwner;
  amenities: string[];
  inquiryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const approvedPropertiesApi = {
  // Get all approved properties (Admin only)
  getAll: async (params?: {
    status?: string;
    type?: string;
  }): Promise<ApiResponse<ApprovedProperty[]>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append("status", params.status);
      if (params?.type) queryParams.append("type", params.type);

      const response = await axios.get(
        `/api/approved-properties?${queryParams}`
      );
      return {
        success: true,
        data: response.data.properties,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error:
            error.response.data.error || "Failed to fetch approved properties",
        };
      }
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  },

  // Create approved property from inquiry (Admin only)
  create: async (propertyData: {
    inquiryId: string;
    title: string;
    location: string;
    size: string;
    price: string;
    type: ApprovedProperty["type"];
    status?: ApprovedProperty["status"];
    image?: string;
    amenities?: string[];
  }): Promise<ApiResponse<ApprovedProperty>> => {
    try {
      const response = await axios.post(
        "/api/approved-properties",
        propertyData
      );
      return {
        success: true,
        data: response.data.property,
        message: response.data.message,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error:
            error.response.data.error || "Failed to create approved property",
        };
      }
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  },

  // Get single approved property
  getById: async (id: string): Promise<ApiResponse<ApprovedProperty>> => {
    try {
      const response = await axios.get(`/api/approved-properties/${id}`);
      return {
        success: true,
        data: response.data.property,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error:
            error.response.data.error || "Failed to fetch approved property",
        };
      }
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  },

  update: async (id: string, data: CreatePropertyRequest) => {
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error updating property:", error);
      return { success: false, error: "Network error occurred" };
    }
  },

  // Delete approved property (Admin only)
  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await axios.delete(`/api/approved-properties/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error:
            error.response.data.error || "Failed to delete approved property",
        };
      }
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  },
};
