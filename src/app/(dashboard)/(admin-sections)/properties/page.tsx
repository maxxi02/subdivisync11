// src/components/PropertyManagement.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  MapPin,
  Search,
  Eye,
  Edit,
  Plus,
  Home,
  Bed,
  Bath,
  Square,
  Car,
  Wifi,
  Dumbbell,
  Shield,
  Trees,
  Upload,
  FileText,
  Users,
  Mail,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { uploadImageToServer, validateImageFile } from "@/lib/upload";
import CustomCarousel from "./_components/carousel";
import Image from "next/image";

// Types
interface PropertyOwner {
  fullName?: string;
  email?: string;
  phone?: string;
}

interface Inquiry {
  _id: string;
  propertyId: string;
  tenantId: string;
  reason: string;
  duration: string;
  status: "UNDER_INQUIRY" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  created_at: string;
}

interface Property {
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
  inquiry?: Inquiry;
}

interface CreatePropertyRequest {
  title: string;
  location: string;
  size: string;
  price: string;
  type: string;
  status: "CREATED" | "UNDER_INQUIRY" | "APPROVED" | "REJECTED" | "LEASED";
  images?: string[];
  amenities?: string[];
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
}

interface UpdatePropertyRequest extends CreatePropertyRequest {
  owner_details?: {
    fullName: string;
    email: string;
    phone: string;
  };
}

interface InquiryRequest {
  propertyId: string;
  reason: string;
  duration: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface ImageUploadPreviewProps {
  images: string[] | undefined;
  selectedImages: File[];
  onImageChange: (files: File[], isEdit: boolean) => void;
  onRemoveImage: (index: number, type: "existing" | "new") => void;
  isEdit?: boolean;
}

type ImageType = "existing" | "new";

const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({
  images,
  selectedImages,
  onImageChange,
  onRemoveImage,
  isEdit = false,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onImageChange(files, isEdit);
    }
  };

  const handleRemoveClick = (index: number, type: ImageType): void => {
    onRemoveImage(index, type);
  };

  const inputId = isEdit ? "edit-images" : "images";

  return (
    <div>
      <Label htmlFor={inputId}>Property Images</Label>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            id={inputId}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(inputId)?.click()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Images
          </Button>
          <span className="text-sm text-gray-500">
            {selectedImages.length} new images selected
          </span>
        </div>

        {images && images.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Current Images:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {images.map((image: string, index: number) => (
                <div key={`existing-${index}`} className="relative">
                  <Image
                    src={image}
                    alt={`Property ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                    height={500}
                    width={500}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-600 hover:bg-red-700"
                    onClick={() => handleRemoveClick(index, "existing")}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedImages.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              New Images:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {selectedImages.map((file: File, index: number) => (
                <div key={`new-${index}`} className="relative">
                  <Image
                    width={500}
                    height={500}
                    src={URL.createObjectURL(file)}
                    alt={`New ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-600 hover:bg-red-700"
                    onClick={() => handleRemoveClick(index, "new")}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PropertyManagement = () => {
  const [ownerDetails, setOwnerDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false); // New loading state for create button
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 50,
    pages: 1,
  });
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePropertyRequest>({
    title: "",
    location: "",
    size: "",
    price: "",
    type: "residential-lot",
    status: "CREATED",
    images: [],
    amenities: [],
    description: "",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
  });

  const [editFormData, setEditFormData] = useState<
    CreatePropertyRequest & { _id?: string }
  >({
    title: "",
    location: "",
    size: "",
    price: "",
    type: "residential-lot",
    status: "CREATED",
    images: [],
    amenities: [],
    description: "",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const fetchProperties = async (page: number = 1) => {
    try {
      // setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/properties?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch properties");
      }
      setProperties(data.properties);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setError((error as Error).message || "Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.type !== "house-and-lot" && formData.type !== "condo") {
      setFormData({
        ...formData,
        bedrooms: undefined,
        bathrooms: undefined,
      });
    }
  }, [formData.type]);

  useEffect(() => {
    if (
      editFormData.type !== "house-and-lot" &&
      editFormData.type !== "condo"
    ) {
      setEditFormData({
        ...editFormData,
        bedrooms: undefined,
        bathrooms: undefined,
      });
    }
  }, [editFormData.type]);

  useEffect(() => {
    fetchProperties();
  }, [searchQuery]);

  const handleImageChange = (files: File[], isEdit: boolean): void => {
    setSelectedImages((prevImages) => [...prevImages, ...files]);
  };

  const handleRemoveImage = (index: number, type: ImageType): void => {
    if (type === "existing") {
      const currentFormData = editModalOpen ? editFormData : formData;
      const updatedImages =
        currentFormData.images?.filter((_, i) => i !== index) || [];
      if (editModalOpen) {
        setEditFormData({ ...editFormData, images: updatedImages });
      } else {
        setFormData({ ...formData, images: updatedImages });
      }
    } else if (type === "new") {
      setSelectedImages((prevImages) =>
        prevImages.filter((_, i) => i !== index)
      );
    }
  };

  const handleCreateProperty = async (): Promise<void> => {
    try {
      setCreateLoading(true); // Set loading state
      setError(null);

      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(
          async (file: File): Promise<string> => {
            try {
              const validation = validateImageFile(file);
              if (!validation.valid) {
                throw new Error(validation.error);
              }
              const result = await uploadImageToServer(file);
              if (!result.success) {
                throw new Error(
                  result.error || `Failed to upload ${file.name}`
                );
              }
              return result.imageUrl!;
            } catch (uploadError) {
              console.error("Error uploading file:", file.name, uploadError);
              throw new Error(`Failed to upload ${file.name}`);
            }
          }
        );

        imageUrls = await Promise.all(uploadPromises);
      }

      const requestBody: CreatePropertyRequest = {
        ...formData,
        images: [...(formData.images || []), ...imageUrls],
        status: formData.status as
          | "CREATED"
          | "UNDER_INQUIRY"
          | "APPROVED"
          | "REJECTED"
          | "LEASED",
      };

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data: { success: boolean; property?: Property; error?: string } =
        await response.json();

      if (!data.success || !data.property) {
        throw new Error(data.error || "Failed to create property");
      }

      setProperties([...properties, data.property]);
      setCreateModalOpen(false);

      setFormData({
        title: "",
        location: "",
        size: "",
        price: "",
        type: "residential-lot",
        status: "CREATED",
        images: [],
        amenities: [],
        description: "",
        bedrooms: 0,
        bathrooms: 0,
        sqft: 0,
      });
      setSelectedImages([]);
    } catch (error) {
      console.error("Error creating property:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create property";
      setError(errorMessage);
    } finally {
      setCreateLoading(false); // Reset loading state
    }
  };

  const handleEditProperty = async (): Promise<void> => {
    try {
      setError(null);
      let newImageUrls: string[] = [];

      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(
          async (file: File): Promise<string> => {
            try {
              const validation = validateImageFile(file);
              if (!validation.valid) {
                throw new Error(validation.error);
              }
              const result = await uploadImageToServer(file);
              if (!result.success) {
                throw new Error(
                  result.error || `Failed to upload ${file.name}`
                );
              }
              return result.imageUrl!;
            } catch (uploadError) {
              console.error("Error uploading file:", file.name, uploadError);
              throw new Error(`Failed to upload ${file.name}`);
            }
          }
        );
        newImageUrls = await Promise.all(uploadPromises);
      }

      const requestBody: UpdatePropertyRequest = {
        title: editFormData.title,
        location: editFormData.location,
        size: editFormData.size,
        price: editFormData.price,
        type: editFormData.type,
        status: editFormData.status,
        images: [...(editFormData.images || []), ...newImageUrls],
        amenities: editFormData.amenities || [],
        description: editFormData.description || "",
        bedrooms: editFormData.bedrooms || 0,
        bathrooms: editFormData.bathrooms || 0,
        sqft: editFormData.sqft || 0,
      };

      if (editFormData.status === "LEASED") {
        requestBody.owner_details = {
          fullName: ownerDetails.fullName,
          email: ownerDetails.email,
          phone: ownerDetails.phone,
        };
      }

      const response = await fetch(`/api/properties/${editFormData._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data: { success: boolean; property?: Property; error?: string } =
        await response.json();
      if (!data.success || !data.property) {
        throw new Error(data.error || "Failed to update property");
      }

      setProperties(
        properties.map((p) =>
          p._id === data.property!._id ? data.property! : p
        )
      );
      setEditModalOpen(false);
      setEditFormData({
        title: "",
        location: "",
        size: "",
        price: "",
        type: "residential-lot",
        status: "CREATED",
        images: [],
        amenities: [],
        description: "",
        bedrooms: 0,
        bathrooms: 0,
        sqft: 0,
      });
      setSelectedImages([]);
      setOwnerDetails({ fullName: "", email: "", phone: "" });
    } catch (error) {
      console.error("Error updating property:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update property";
      setError(errorMessage);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete property");
      }

      setProperties(properties.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Error deleting property:", error);
      setError((error as Error).message || "Failed to delete property");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CREATED":
        return "bg-gray-100 text-gray-800";
      case "UNDER_INQUIRY":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "LEASED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "parking":
        return <Car className="w-4 h-4" />;
      case "gym":
        return <Dumbbell className="w-4 h-4" />;
      case "security":
        return <Shield className="w-4 h-4" />;
      case "internet-ready":
        return <Wifi className="w-4 h-4" />;
      case "garden":
        return <Trees className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: pagination.total,
    created: properties.filter((p) => p.status === "CREATED").length,
    leased: properties.filter((p) => p.status === "LEASED").length,
    underInquiry: properties.filter((p) => p.status === "UNDER_INQUIRY").length,
  };

  const handleAmenitiesChange = (value: string, isEdit: boolean = false) => {
    const currentAmenities = isEdit
      ? editFormData.amenities || []
      : formData.amenities || [];
    if (currentAmenities.includes(value)) {
      const newAmenities = currentAmenities.filter((a) => a !== value);
      if (isEdit) {
        setEditFormData({ ...editFormData, amenities: newAmenities });
      } else {
        setFormData({ ...formData, amenities: newAmenities });
      }
    } else {
      const newAmenities = [...currentAmenities, value];
      if (isEdit) {
        setEditFormData({ ...editFormData, amenities: newAmenities });
      } else {
        setFormData({ ...formData, amenities: newAmenities });
      }
    }
  };

  const openEditModal = (property: Property) => {
    setEditFormData({
      _id: property._id,
      title: property.title,
      location: property.location,
      size: property.size,
      price: property.price.toString(),
      type: property.type,
      status: property.status,
      images: property.images || [],
      amenities: property.amenities || [],
      description: property.description || "",
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft || 0,
    });
    setOwnerDetails({
      fullName: property.owner?.fullName || "",
      email: property.owner?.email || "",
      phone: property.owner?.phone || "",
    });
    setSelectedImages([]);
    setEditModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Property Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your property listings and inquiries
              </p>
            </div>
            <div className="flex gap-4">
              <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Property
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                      Add New Property
                    </DialogTitle>
                    <DialogDescription>
                      Create a new property listing
                    </DialogDescription>
                  </DialogHeader>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Property Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Enter property title"
                        required
                        className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location/Address *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="Enter property location"
                        required
                        className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="size">Size *</Label>
                      <Input
                        id="size"
                        value={formData.size}
                        onChange={(e) =>
                          setFormData({ ...formData, size: e.target.value })
                        }
                        placeholder="e.g., 300 sqm"
                        required
                        className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        placeholder="e.g., ₱2,500,000"
                        required
                        className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Property Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential-lot">
                            Residential Lot
                          </SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="house-and-lot">
                            House and Lot
                          </SelectItem>
                          <SelectItem value="condo">Condominium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            status: value as
                              | "CREATED"
                              | "UNDER_INQUIRY"
                              | "APPROVED"
                              | "REJECTED"
                              | "LEASED",
                          })
                        }
                      >
                        <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREATED">Available</SelectItem>
                          <SelectItem value="UNDER_INQUIRY">
                            Under Inquiry
                          </SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                          <SelectItem value="LEASED">Leased</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <ImageUploadPreview
                      images={formData.images}
                      selectedImages={selectedImages}
                      onImageChange={handleImageChange}
                      onRemoveImage={handleRemoveImage}
                    />
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter property description"
                        className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amenities">Amenities</Label>
                      <Select
                        onValueChange={(value) => handleAmenitiesChange(value)}
                      >
                        <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Select amenities" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "parking",
                            "gym",
                            "security",
                            "internet-ready",
                            "garden",
                          ].map((amenity) => (
                            <SelectItem key={amenity} value={amenity}>
                              <div className="flex items-center space-x-2">
                                {getAmenityIcon(amenity)}
                                <span>
                                  {amenity
                                    .replace("-", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.amenities?.map((amenity) => (
                          <Badge key={amenity} variant="secondary">
                            {amenity
                              .replace("-", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {(formData.type === "house-and-lot" ||
                      formData.type === "condo") && (
                      <>
                        <div>
                          <Label htmlFor="bedrooms">Bedrooms</Label>
                          <Input
                            id="bedrooms"
                            type="number"
                            value={formData.bedrooms || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bedrooms: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              })
                            }
                            placeholder="e.g., 3"
                            className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bathrooms">Bathrooms</Label>
                          <Input
                            id="bathrooms"
                            type="number"
                            value={formData.bathrooms || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bathrooms: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              })
                            }
                            placeholder="e.g., 2"
                            className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}
                    <Button
                      onClick={handleCreateProperty}
                      disabled={createLoading}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${
                        createLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {createLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Create Property
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">
                  Total Listed
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-100">
                  Under Inquiry
                </p>
                <p className="text-2xl font-bold">{stats.underInquiry}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Leased</p>
                <p className="text-2xl font-bold">{stats.leased}</p>
              </div>
              <div className="h-12 w-12 bg-purple-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error Occurred
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Properties List */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Manage Properties
              </h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No properties found
                      </h3>
                      <p className="text-gray-500">
                        Create a new property to get started
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProperties.map((property) => (
                    <TableRow key={property._id} className="hover:bg-gray-50">
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                            {property.images && property.images.length > 0 ? (
                              <Image
                                src={property.images[0] || "/placeholder.svg"}
                                alt={property.title}
                                className="w-full h-full object-cover"
                                height={500}
                                width={500}
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {property.title}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {property.location}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary" className="text-xs">
                          {property.type.replace("-", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {property.size}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {formatCurrency(property.price)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            property.status
                          )}`}
                        >
                          {property.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedProperty(property);
                              setViewModalOpen(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(property)}
                            className="bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(property._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 flex items-center gap-1"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-4 px-4">
                <Button
                  disabled={pagination.page === 1}
                  onClick={() => fetchProperties(pagination.page - 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => fetchProperties(pagination.page + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            {selectedProperty && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    {selectedProperty.title}
                  </DialogTitle>
                  <DialogDescription className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedProperty.location}</span>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {selectedProperty.images &&
                  selectedProperty.images.length > 0 ? (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <CustomCarousel
                        images={selectedProperty.images}
                        height={400}
                        alt={selectedProperty.title}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No images available</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-green-600">
                          {formatCurrency(selectedProperty.price)}
                        </h3>
                        <Badge
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            selectedProperty.status
                          )}`}
                        >
                          {selectedProperty.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {selectedProperty.type
                              .replace("-", " ")
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Square className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {selectedProperty.size}
                          </span>
                        </div>
                      </div>
                      {(selectedProperty.type === "house-and-lot" ||
                        selectedProperty.type === "condo") && (
                        <div className="flex items-center space-x-6">
                          {selectedProperty.bedrooms &&
                            selectedProperty.bedrooms > 0 && (
                              <div className="flex items-center space-x-2">
                                <Bed className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {selectedProperty.bedrooms} Bedroom
                                  {selectedProperty.bedrooms > 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                          {selectedProperty.bathrooms &&
                            selectedProperty.bathrooms > 0 && (
                              <div className="flex items-center space-x-2">
                                <Bath className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {selectedProperty.bathrooms} Bathroom
                                  {selectedProperty.bathrooms > 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                          {selectedProperty.sqft &&
                            selectedProperty.sqft > 0 && (
                              <div className="flex items-center space-x-2">
                                <Square className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {selectedProperty.sqft} sq ft
                                </span>
                              </div>
                            )}
                        </div>
                      )}
                      {selectedProperty.description && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Description
                          </h4>
                          <p className="text-gray-600 leading-relaxed">
                            {selectedProperty.description}
                          </p>
                        </div>
                      )}
                      {selectedProperty.amenities &&
                        selectedProperty.amenities.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Home className="h-5 w-5" />
                              Amenities & Features
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedProperty.amenities.map(
                                (amenity, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2 text-sm text-gray-600"
                                  >
                                    {getAmenityIcon(amenity)}
                                    <span>
                                      {amenity
                                        .replace("-", " ")
                                        .replace(/\b\w/g, (l) =>
                                          l.toUpperCase()
                                        )}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      {selectedProperty.inquiry && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Inquiry Status
                          </h4>
                          <div className="space-y-2">
                            <p className="text-sm text-blue-600">
                              <strong>Reason:</strong>{" "}
                              {selectedProperty.inquiry.reason}
                            </p>
                            <p className="text-sm text-blue-600">
                              <strong>Duration:</strong>{" "}
                              {selectedProperty.inquiry.duration}
                            </p>
                            <p className="text-sm text-blue-600">
                              <strong>Status:</strong>{" "}
                              {selectedProperty.inquiry.status}
                            </p>
                            {selectedProperty.inquiry.status === "REJECTED" &&
                              selectedProperty.inquiry.rejectionReason && (
                                <p className="text-sm text-red-600">
                                  <strong>Rejection Reason:</strong>{" "}
                                  {selectedProperty.inquiry.rejectionReason}
                                </p>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Owner Information
                        </h4>
                        {selectedProperty.owner ? (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {selectedProperty.owner.fullName}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {selectedProperty.owner.email}
                              </span>
                            </div>
                            {selectedProperty.owner.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {selectedProperty.owner.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">No owner assigned</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setViewModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Edit Property
              </DialogTitle>
              <DialogDescription>Update the property listing</DialogDescription>
            </DialogHeader>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Property Title *</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  placeholder="Enter property title"
                  required
                  className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Location/Address *</Label>
                <Input
                  id="edit-location"
                  value={editFormData.location}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      location: e.target.value,
                    })
                  }
                  placeholder="Enter property location"
                  required
                  className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-size">Size *</Label>
                <Input
                  id="edit-size"
                  value={editFormData.size}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, size: e.target.value })
                  }
                  placeholder="e.g., 300 sqm"
                  required
                  className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  value={editFormData.price}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, price: e.target.value })
                  }
                  placeholder="e.g., ₱2,500,000"
                  required
                  className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Property Type *</Label>
                <Select
                  value={editFormData.type}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, type: value })
                  }
                >
                  <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential-lot">
                      Residential Lot
                    </SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="house-and-lot">House and Lot</SelectItem>
                    <SelectItem value="condo">Condominium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) =>
                    setEditFormData({
                      ...editFormData,
                      status: value as
                        | "CREATED"
                        | "UNDER_INQUIRY"
                        | "APPROVED"
                        | "REJECTED"
                        | "LEASED",
                    })
                  }
                >
                  <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREATED">Available</SelectItem>
                    <SelectItem value="UNDER_INQUIRY">Under Inquiry</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="LEASED">Leased</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editFormData.status === "LEASED" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-gray-900">Owner Details</h4>
                  <div>
                    <Label htmlFor="owner-name">Full Name *</Label>
                    <Input
                      id="owner-name"
                      value={ownerDetails.fullName}
                      onChange={(e) =>
                        setOwnerDetails({
                          ...ownerDetails,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="Enter owner's full name"
                      required
                      className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-email">Email *</Label>
                    <Input
                      id="owner-email"
                      type="email"
                      value={ownerDetails.email}
                      onChange={(e) =>
                        setOwnerDetails({
                          ...ownerDetails,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter owner's email"
                      required
                      className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-phone">Phone</Label>
                    <Input
                      id="owner-phone"
                      value={ownerDetails.phone}
                      onChange={(e) =>
                        setOwnerDetails({
                          ...ownerDetails,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Enter owner's phone"
                      className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <ImageUploadPreview
                images={editFormData.images}
                selectedImages={selectedImages}
                onImageChange={handleImageChange}
                onRemoveImage={handleRemoveImage}
                isEdit
              />
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter property description"
                  className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-amenities">Amenities</Label>
                <Select
                  onValueChange={(value) => handleAmenitiesChange(value, true)}
                >
                  <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Select amenities" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "parking",
                      "gym",
                      "security",
                      "internet-ready",
                      "garden",
                    ].map((amenity) => (
                      <SelectItem key={amenity} value={amenity}>
                        <div className="flex items-center space-x-2">
                          {getAmenityIcon(amenity)}
                          <span>
                            {amenity
                              .replace("-", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex flex-wrap gap-2">
                  {editFormData.amenities?.map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity
                        .replace("-", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
              {(editFormData.type === "house-and-lot" ||
                editFormData.type === "condo") && (
                <>
                  <div>
                    <Label htmlFor="edit-bedrooms">Bedrooms</Label>
                    <Input
                      id="edit-bedrooms"
                      type="number"
                      value={editFormData.bedrooms || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          bedrooms: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="e.g., 3"
                      className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-bathrooms">Bathrooms</Label>
                    <Input
                      id="edit-bathrooms"
                      type="number"
                      value={editFormData.bathrooms || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          bathrooms: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="e.g., 2"
                      className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              <Button
                onClick={handleEditProperty}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Property
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PropertyManagement;
