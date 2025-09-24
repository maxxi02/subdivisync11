"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";
import { uploadImageToServer, validateImageFile } from "@/lib/upload";
import CustomCarousel from "./_components/carousel";

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
                  <img
                    src={image}
                    alt={`Property ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
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
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
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
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
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

  const [inquiryForm, setInquiryForm] = useState<InquiryRequest>({
    propertyId: "",
    reason: "",
    duration: "",
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const fetchProperties = async (page: number = 1) => {
    try {
      setLoading(true);
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

      const requestBody = {
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

      const requestBody: any = {
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
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "UNDER_INQUIRY":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "LEASED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold">Property Management</h1>
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                  <DialogDescription>
                    Create a new property listing
                  </DialogDescription>
                </DialogHeader>
                {error && <p className="text-red-500">{error}</p>}
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="amenities">Amenities</Label>
                    <Select
                      onValueChange={(value) => handleAmenitiesChange(value)}
                    >
                      <SelectTrigger>
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
                              bedrooms: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="e.g., 3"
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
                              bathrooms: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="e.g., 2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sqft">Square Footage</Label>
                        <Input
                          id="sqft"
                          type="number"
                          value={formData.sqft || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sqft: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="e.g., 2500"
                        />
                      </div>
                    </>
                  )}
                  <Button onClick={handleCreateProperty}>
                    Create Property
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Listed
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Under Inquiry
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.underInquiry}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <FileText className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Leased</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.leased}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-semibold">
                  My Properties
                </CardTitle>
                <CardDescription>
                  Manage your property listings and inquiries
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No properties found
                </h3>
                <p className="text-gray-500">
                  Create a new property to get started
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Property</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Size</TableHead>
                      <TableHead className="font-semibold">Price</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property._id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {property.images && property.images.length > 0 ? (
                                <img
                                  src={property.images[0] || "/placeholder.svg"}
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Building2 className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {property.title}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {property.location}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {property.type.replace("-", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {property.size}
                        </TableCell>
                        <TableCell className="text-sm font-bold text-green-600">
                          ${property.price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${getStatusColor(
                              property.status
                            )}`}
                          >
                            {property.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProperty(property);
                                setViewModalOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(property)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProperty(property._id)}
                            >
                              <svg
                                className="w-4 h-4 text-red-600"
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
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {pagination.pages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      disabled={pagination.page === 1}
                      onClick={() => fetchProperties(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      disabled={pagination.page === pagination.pages}
                      onClick={() => fetchProperties(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedProperty && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">
                    {selectedProperty.title}
                  </DialogTitle>
                  <DialogDescription className="flex items-center space-x-2">
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
                        <h3 className="text-3xl font-bold text-green-600">
                          ${selectedProperty.price.toLocaleString()}
                        </h3>
                        <Badge
                          className={`${getStatusColor(
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
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Description
                          </h4>
                          <p className="text-gray-600 leading-relaxed">
                            {selectedProperty.description}
                          </p>
                        </div>
                      )}
                      {selectedProperty.amenities &&
                        selectedProperty.amenities.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">
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
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Inquiry Status
                          </h4>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              <strong>Reason:</strong>{" "}
                              {selectedProperty.inquiry.reason}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Duration:</strong>{" "}
                              {selectedProperty.inquiry.duration}
                            </p>
                            <p className="text-sm text-gray-600">
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
                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Owner Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {selectedProperty.owner ? (
                            <>
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">
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
                            </>
                          ) : (
                            <p className="text-gray-500">No owner assigned</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
              <DialogDescription>Update the property listing</DialogDescription>
            </DialogHeader>
            {error && <p className="text-red-500">{error}</p>}
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                  <h4 className="font-semibold">Owner Details</h4>
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
                />
              </div>
              <div>
                <Label htmlFor="edit-amenities">Amenities</Label>
                <Select
                  onValueChange={(value) => handleAmenitiesChange(value, true)}
                >
                  <SelectTrigger>
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
                          bedrooms: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="e.g., 3"
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
                          bathrooms: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="e.g., 2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-sqft">Square Footage</Label>
                    <Input
                      id="edit-sqft"
                      type="number"
                      value={editFormData.sqft || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          sqft: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="e.g., 2500"
                    />
                  </div>
                </>
              )}
              <Button onClick={handleEditProperty}>Update Property</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={inquiryModalOpen} onOpenChange={setInquiryModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Make an Inquiry</DialogTitle>
              <DialogDescription>
                Submit an inquiry for the selected property
              </DialogDescription>
            </DialogHeader>
            {error && <p className="text-red-500">{error}</p>}
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Reason for Inquiry *</Label>
                <Textarea
                  id="reason"
                  value={inquiryForm.reason}
                  onChange={(e) =>
                    setInquiryForm({ ...inquiryForm, reason: e.target.value })
                  }
                  placeholder="Enter your reason for inquiry"
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Preferred Lease Duration *</Label>
                <Input
                  id="duration"
                  value={inquiryForm.duration}
                  onChange={(e) =>
                    setInquiryForm({ ...inquiryForm, duration: e.target.value })
                  }
                  placeholder="e.g., 1 year"
                  required
                />
              </div>
              <Button
                onClick={async () => {
                  try {
                    setError(null);
                    const response = await fetch("/api/inquiries", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(inquiryForm),
                    });
                    const data = await response.json();
                    if (!data.success) {
                      throw new Error(data.error || "Failed to submit inquiry");
                    }
                    setInquiryModalOpen(false);
                    setInquiryForm({
                      propertyId: "",
                      reason: "",
                      duration: "",
                    });
                    fetchProperties();
                  } catch (error) {
                    console.error("Error submitting inquiry:", error);
                    setError(
                      (error as Error).message || "Failed to submit inquiry"
                    );
                  }
                }}
              >
                Submit Inquiry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PropertyManagement;
