import axios from "axios";

interface PropertyFormData {
  address: string;
  rent_amount: number;
  description: string;
  photos: string[];
  availability_status: "Available" | "Pending" | "Rented";
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  type: "Apartment" | "House" | "Penthouse" | "Studio";
  amenities: string[];
}

// API functions using axios
export const propertyAPI = {
  getAll: () => axios.get("/api/properties"),
  create: (data: PropertyFormData) => axios.post("/api/properties", data),
  update: (id: string, data: PropertyFormData) =>
    axios.put(`/api/properties/${id}`, data),
  delete: (id: string) => axios.delete(`/api/properties/${id}`),
};
