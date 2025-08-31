// hooks/useApprovedProperties.ts - Custom React hook for approved properties
import { useState, useEffect } from "react";
import {
  approvedPropertiesApi,
  ApprovedProperty,
} from "@/lib/api/approved-properties";

export const useApprovedProperties = (filters?: {
  status?: string;
  type?: string;
}) => {
  const [properties, setProperties] = useState<ApprovedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await approvedPropertiesApi.getAll(filters);

      if (response.success && response.data) {
        setProperties(response.data);
      } else {
        setError(response.error || "Failed to fetch approved properties");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [filters?.status, filters?.type]);

  const createProperty = async (
    propertyData: Parameters<typeof approvedPropertiesApi.create>[0]
  ) => {
    const response = await approvedPropertiesApi.create(propertyData);
    if (response.success) {
      await fetchProperties(); // Refresh the list
    }
    return response;
  };

  const updateProperty = async (
    id: string,
    updateData: Parameters<typeof approvedPropertiesApi.update>[1]
  ) => {
    const response = await approvedPropertiesApi.update(id, updateData);
    if (response.success) {
      await fetchProperties(); // Refresh the list
    }
    return response;
  };

  const deleteProperty = async (id: string) => {
    const response = await approvedPropertiesApi.delete(id);
    if (response.success) {
      await fetchProperties(); // Refresh the list
    }
    return response;
  };

  return {
    properties,
    loading,
    error,
    refetch: fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  };
};
