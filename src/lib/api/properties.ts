import axios from "axios";

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
  image?: string;
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
  size: string;
  price: string;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "available" | "reserved" | "sold" | "rented";
  image?: string;
  amenities: string[];
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
}

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
};
