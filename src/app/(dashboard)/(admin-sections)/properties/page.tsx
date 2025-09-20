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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  DollarSign,
  Search,
  Eye,
  Edit,
  Plus,
  Home,
  Users,
  Phone,
  Mail,
  Bed,
  Bath,
  Square,
  Car,
  Wifi,
  Dumbbell,
  Shield,
  Trees,
  Send,
  FileText,
  Upload,
} from "lucide-react";

// Types
interface PropertyOwner {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentStatus?: "paid" | "partial" | "pending";
  paymentMethod?: string;
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

interface Transaction {
  _id: string;
  propertyId: string;
  tenantId: string;
  amount: number;
  dueDate: string;
  status: "PAID" | "PENDING" | "OVERDUE";
  paymentDate?: string;
  lateFee?: number;
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
  transactions?: Transaction[];
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

const PropertyManagement = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("properties");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [transactionsModalOpen, setTransactionsModalOpen] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 50,
    pages: 1,
  });
  const [error, setError] = useState<string | null>(null);

  // Form states
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

  const handleCreateProperty = async () => {
    try {
      setError(null);
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status: formData.status as
            | "CREATED"
            | "UNDER_INQUIRY"
            | "APPROVED"
            | "REJECTED"
            | "LEASED",
        }),
      });
      const data = await response.json();
      if (!data.success) {
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
      setError((error as Error).message || "Failed to create property");
    }
  };

  const handleEditProperty = async () => {
    try {
      setError(null);
      const response = await fetch("/api/properties", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update property");
      }
      setProperties(
        properties.map((p) => (p._id === data.property._id ? data.property : p))
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
      setError((error as Error).message || "Failed to update property");
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/properties?id=${id}`, {
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

  const handleSubmitInquiry = async () => {
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
      setProperties(
        properties.map((p) =>
          p._id === inquiryForm.propertyId
            ? { ...p, status: "UNDER_INQUIRY", inquiry: data.inquiry }
            : p
        )
      );
      setInquiryModalOpen(false);
      setInquiryForm({ propertyId: "", reason: "", duration: "" });
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      setError((error as Error).message || "Failed to submit inquiry");
    }
  };

  const handleMakePayment = async (transactionId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/transactions/${transactionId}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to process payment");
      }
      setProperties(
        properties.map((p) =>
          p.transactions?.some((t) => t._id === transactionId)
            ? {
                ...p,
                status: "LEASED",
                transactions: p.transactions?.map((t) =>
                  t._id === transactionId
                    ? {
                        ...t,
                        status: "PAID",
                        paymentDate: new Date().toISOString(),
                      }
                    : t
                ),
              }
            : p
        )
      );
    } catch (error) {
      console.error("Error processing payment:", error);
      setError((error as Error).message || "Failed to process payment");
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

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages(files);
      // Simulate image URLs for mock data
      const imageUrls = files.map((file) => URL.createObjectURL(file));
      if (isEdit) {
        setEditFormData({ ...editFormData, images: imageUrls });
      } else {
        setFormData({ ...formData, images: imageUrls });
      }
    }
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
      {/* Header */}
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
                  <div>
                    <Label htmlFor="images">Property Images</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageChange(e)}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          document.getElementById("images")?.click()
                        }
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Select Images
                      </Button>
                      <span className="text-sm text-gray-500">
                        {selectedImages.length} images selected
                      </span>
                    </div>
                  </div>
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
        {/* Stats Cards */}
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

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger
              value="properties"
              className="data-[state=active]:bg-black data-[state=active]:text-white"
            >
              My Properties
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Transactions ({stats.leased})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-6">
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
                          <TableHead className="font-semibold">
                            Property
                          </TableHead>
                          <TableHead className="font-semibold">
                            Location
                          </TableHead>
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="font-semibold">Size</TableHead>
                          <TableHead className="font-semibold">Price</TableHead>
                          <TableHead className="font-semibold">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProperties.map((property) => (
                          <TableRow
                            key={property._id}
                            className="hover:bg-gray-50"
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                  {property.images &&
                                  property.images.length > 0 ? (
                                    <img
                                      src={
                                        property.images[0] || "/placeholder.svg"
                                      }
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
                                  onClick={() =>
                                    handleDeleteProperty(property._id)
                                  }
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
                                {property.status === "CREATED" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setInquiryForm({
                                        ...inquiryForm,
                                        propertyId: property._id,
                                      });
                                      setInquiryModalOpen(true);
                                    }}
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                )}
                                {property.status === "APPROVED" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedProperty(property);
                                      setTransactionsModalOpen(true);
                                    }}
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </Button>
                                )}
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
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      Transactions
                    </CardTitle>
                    <CardDescription>
                      View and manage your payment transactions
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {properties.filter(
                  (p) => p.transactions && p.transactions.length > 0
                ).length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No transactions found
                    </h3>
                    <p className="text-gray-500">
                      Transactions will appear once properties are leased
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">
                            Property
                          </TableHead>
                          <TableHead className="font-semibold">
                            Amount
                          </TableHead>
                          <TableHead className="font-semibold">
                            Due Date
                          </TableHead>
                          <TableHead className="font-semibold">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {properties
                          .filter(
                            (p) => p.transactions && p.transactions.length > 0
                          )
                          .map((property) =>
                            property.transactions?.map((transaction) => (
                              <TableRow
                                key={transaction._id}
                                className="hover:bg-gray-50"
                              >
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                      {property.images &&
                                      property.images.length > 0 ? (
                                        <img
                                          src={
                                            property.images[0] ||
                                            "/placeholder.svg"
                                          }
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
                                      <p className="text-xs text-gray-500">
                                        {property.location}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm font-bold text-green-600">
                                  ${transaction.amount.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {transaction.dueDate}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      transaction.status === "PAID"
                                        ? "bg-green-100 text-green-800"
                                        : transaction.status === "PENDING"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {transaction.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {transaction.status !== "PAID" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleMakePayment(transaction._id)
                                      }
                                    >
                                      <DollarSign className="w-4 h-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Property Detail Modal */}
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
                      <img
                        src={selectedProperty.images[0] || "/placeholder.svg"}
                        alt={selectedProperty.title}
                        className="w-full h-full object-cover"
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
                              {selectedProperty.owner.address && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {selectedProperty.owner.address}
                                  </span>
                                </div>
                              )}
                              {selectedProperty.owner.paymentStatus && (
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4 text-gray-400" />
                                  <Badge
                                    className={
                                      selectedProperty.owner.paymentStatus ===
                                      "paid"
                                        ? "bg-green-100 text-green-800"
                                        : selectedProperty.owner
                                            .paymentStatus === "partial"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {selectedProperty.owner.paymentStatus.toUpperCase()}
                                  </Badge>
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

        {/* Edit Property Modal */}
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
              <div>
                <Label htmlFor="edit-images">Property Images</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="edit-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, true)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("edit-images")?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Images
                  </Button>
                  <span className="text-sm text-gray-500">
                    {selectedImages.length} images selected
                  </span>
                </div>
              </div>
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

        {/* Inquiry Modal */}
        <Dialog open={inquiryModalOpen} onOpenChange={setInquiryModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Inquiry</DialogTitle>
              <DialogDescription>Apply for property inquiry</DialogDescription>
            </DialogHeader>
            {error && <p className="text-red-500">{error}</p>}
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Reason for Inquiry</Label>
                <Textarea
                  id="reason"
                  value={inquiryForm.reason}
                  onChange={(e) =>
                    setInquiryForm({ ...inquiryForm, reason: e.target.value })
                  }
                  placeholder="Why are you interested in this property?"
                />
              </div>
              <div>
                <Label htmlFor="duration">Lease Duration (months)</Label>
                <Input
                  id="duration"
                  value={inquiryForm.duration}
                  onChange={(e) =>
                    setInquiryForm({ ...inquiryForm, duration: e.target.value })
                  }
                  placeholder="e.g., 12"
                />
              </div>
              <Button onClick={handleSubmitInquiry}>Submit Inquiry</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transactions Modal */}
        <Dialog
          open={transactionsModalOpen}
          onOpenChange={setTransactionsModalOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Transactions for {selectedProperty?.title}
              </DialogTitle>
              <DialogDescription>Manage your lease payments</DialogDescription>
            </DialogHeader>
            {error && <p className="text-red-500">{error}</p>}
            <div className="space-y-4">
              {selectedProperty?.transactions &&
              selectedProperty.transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProperty.transactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>
                          ${transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{transaction.dueDate}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              transaction.status === "PAID"
                                ? "bg-green-100 text-green-800"
                                : transaction.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.status !== "PAID" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMakePayment(transaction._id)}
                            >
                              Pay Now
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500">No transactions available</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PropertyManagement;
