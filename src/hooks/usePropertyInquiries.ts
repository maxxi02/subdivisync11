// hooks/usePropertyInquiries.ts - Custom React hook for property inquiries
import { useState, useEffect } from "react";
import {
  propertyInquiriesApi,
  PropertyInquiry,
} from "@/lib/api/property-inquiries";

export const usePropertyInquiries = (filters?: {
  status?: string;
  priority?: string;
}) => {
  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await propertyInquiriesApi.getAll(filters);

      if (response.success && response.data) {
        setInquiries(response.data);
      } else {
        setError(response.error || "Failed to fetch inquiries");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [filters?.status, filters?.priority]);

  const createInquiry = async (
    inquiryData: Omit<
      PropertyInquiry,
      "_id" | "status" | "submittedAt" | "priority" | "createdBy" | "updatedAt"
    >
  ) => {
    const response = await propertyInquiriesApi.create(inquiryData);
    if (response.success) {
      await fetchInquiries(); // Refresh the list
    }
    return response;
  };

  const updateInquiryStatus = async (
    id: string,
    updateData: {
      status: PropertyInquiry["status"];
      priority?: PropertyInquiry["priority"];
      adminNotes?: string;
    }
  ) => {
    const response = await propertyInquiriesApi.updateStatus(id, updateData);
    if (response.success) {
      await fetchInquiries(); // Refresh the list
    }
    return response;
  };

  const deleteInquiry = async (id: string) => {
    const response = await propertyInquiriesApi.delete(id);
    if (response.success) {
      await fetchInquiries(); // Refresh the list
    }
    return response;
  };

  return {
    inquiries,
    loading,
    error,
    refetch: fetchInquiries,
    createInquiry,
    updateInquiryStatus,
    deleteInquiry,
  };
};
