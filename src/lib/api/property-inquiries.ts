import axios from "axios";

// Type definitions
export interface PropertyInquiry {
  _id?: string;
  fullName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  currentAddress: string;
  preferredContactMethod: "phone" | "email" | "text";
  preferredContactTime: string;
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
    | "approved"
    | "rejected"
    | "closed";
  submittedAt: string;
  priority: "high" | "medium" | "low";
  createdBy: string;
  updatedAt?: string;
  adminNotes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Property Inquiries API
export const propertyInquiriesApi = {
  // Create new inquiry
  create: async (
    inquiryData: Omit<
      PropertyInquiry,
      "_id" | "status" | "submittedAt" | "priority" | "createdBy" | "updatedAt"
    >
  ): Promise<ApiResponse<PropertyInquiry>> => {
    try {
      const response = await axios.post("/api/property-inquiries", inquiryData);
      return {
        success: true,
        data: response.data.inquiry,
        message: response.data.message,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || "Failed to submit inquiry",
        };
      }
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  },

  // Get all inquiries (with optional filters)
  getAll: async (params?: {
    status?: string;
    priority?: string;
  }): Promise<ApiResponse<PropertyInquiry[]>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append("status", params.status);
      if (params?.priority) queryParams.append("priority", params.priority);

      const response = await axios.get(
        `/api/property-inquiries?${queryParams}`
      );
      return {
        success: true,
        data: response.data.inquiries,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || "Failed to fetch inquiries",
        };
      }
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  },

  // Get single inquiry
  getById: async (id: string): Promise<ApiResponse<PropertyInquiry>> => {
    try {
      const response = await axios.get(`/api/property-inquiries/${id}`);
      return {
        success: true,
        data: response.data.inquiry,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || "Failed to fetch inquiry",
        };
      }
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  },

  // Update inquiry status (Admin only)
  updateStatus: async (
    id: string,
    updateData: {
      status: PropertyInquiry["status"];
      priority?: PropertyInquiry["priority"];
      adminNotes?: string;
    }
  ): Promise<ApiResponse<PropertyInquiry>> => {
    try {
      const response = await axios.put(
        `/api/property-inquiries/${id}`,
        updateData
      );
      return {
        success: true,
        data: response.data.inquiry,
        message: response.data.message,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || "Failed to update inquiry",
        };
      }
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  },

  // Delete inquiry (Admin only)
  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await axios.delete(`/api/property-inquiries/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || "Failed to delete inquiry",
        };
      }
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  },
};
