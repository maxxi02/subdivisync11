import axios, { AxiosResponse } from "axios";
import { ApiResponse } from "./approved-properties";

interface PropertyOwner {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentStatus?: "paid" | "partial" | "pending";
  paymentMethod?: string;
}

export interface Property {
  _id: string;
  title: string;
  location: string;
  size: string;
  price: string;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "available" | "reserved" | "sold" | "rented";
  images?: string[];
  amenities: string[];
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  created_by?: string;
  created_at: string; // Use this instead of createdAt
  updated_at?: string;
  availability_status?: string;
  owner?: PropertyOwner; // Add this property
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
const baseUrl = "/api/property-inquiries";
export const propertiesApi = {
  getAll: async (params?: { status?: string }) => {
    try {
      const response = await axios.get("/api/properties", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data: CreatePropertyRequest) => {
    try {
      const response = await axios.post("/api/properties", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async update(
    id: string,
    data: Partial<CreatePropertyRequest>
  ): Promise<ApiResponse<Property>> {
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
};
