"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Square,
  Car,
  Wifi,
  Dumbbell,
  Shield,
  Trees,
  AlertCircle,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import Image from "next/image";

// Alert component inline implementation
interface AlertProps {
  children: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}

const Alert = ({
  children,
  variant = "default",
  className = "",
}: AlertProps) => {
  const variantStyles =
    variant === "destructive"
      ? "border-red-200 bg-red-50"
      : "border-green-200 bg-green-50";
  return (
    <div className={`rounded-lg border p-4 ${variantStyles} ${className}`}>
      {children}
    </div>
  );
};

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDescription = ({
  children,
  className = "",
}: AlertDescriptionProps) => {
  return <div className={`text-sm ${className}`}>{children}</div>;
};

interface CustomCarouselProps {
  images: string[];
  alt: string;
}

const CustomCarousel = ({ images, alt }: CustomCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <Building2 className="w-16 h-16 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden group">
      <Image
        width={500}
        height={500}
        src={images[currentIndex] || "/placeholder.svg"}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {images.map((_, index: number) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "bg-white scale-125"
                  : "bg-white/60 hover:bg-white/80"
              }`}
              onClick={() => goToImage(index)}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {images.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

// Property interface
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
  sqft?: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  inquiries?: {
    fullName: string;
    email: string;
    phone: string;
    reason: string;
    submittedAt: string;
    status: "pending" | "approved" | "rejected";
  }[];
}

// InquiryRequest interface
interface InquiryRequest {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
}

const PropertyListingPage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>(""); // New state for user email

  const [inquiryForm, setInquiryForm] = useState<InquiryRequest>({
    fullName: "",
    email: "",
    phone: "",
    reason: "",
  });

  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      setUserEmail(session.user.email);
      setInquiryForm((prev) => ({
        ...prev,
        email: session.user.email,
      }));
    }
  }, [session]);

  // Load properties from API - Using public access
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          public: "true",
          limit: "50",
          page: "1",
        });

        const response = await fetch(`/api/properties?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch properties");
        }

        setProperties(data.properties || []);
        setFilteredProperties(data.properties || []);
      } catch (err) {
        console.error("Error loading properties:", err);
        setError((err as Error).message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  // Filter properties based on search and filters
  useEffect(() => {
    let filtered = properties;

    if (searchQuery) {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((property) => property.type === selectedType);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (property) => property.status === selectedStatus
      );
    }

    setFilteredProperties(filtered);
  }, [properties, searchQuery, selectedType, selectedStatus]);

  const handleInputChange = (field: keyof InquiryRequest, value: string) => {
    setInquiryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (propertyId: string) => {
    setError(null);
    setSuccessMessage(null);

    const requiredFields: (keyof InquiryRequest)[] = [
      "fullName",
      "email",
      "phone",
      "reason",
    ];

    const missingFields = requiredFields.filter((field) => !inquiryForm[field]);

    if (missingFields.length > 0) {
      setError(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiry: {
            fullName: inquiryForm.fullName,
            email: inquiryForm.email,
            phone: inquiryForm.phone,
            reason: inquiryForm.reason,
            submittedAt: new Date().toISOString(),
            status: "pending",
          },
          isInquiry: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to submit inquiry");
      }

      setSuccessMessage("Your inquiry has been submitted successfully!");
      setSelectedProperty(null);
      setInquiryForm({
        fullName: "",
        email: session?.user?.email || userEmail,
        phone: "",
        reason: "",
      });

      const params = new URLSearchParams({
        public: "true",
        limit: "50",
        page: "1",
      });

      const refreshResponse = await fetch(
        `/api/properties?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setProperties(refreshData.properties || []);
          setFilteredProperties(refreshData.properties || []);
        }
      }
    } catch (err) {
      console.error("Error submitting inquiry:", err);
      setError(
        (err as Error).message || "Failed to submit inquiry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CREATED":
        return "bg-green-100 text-green-800 border-green-200";
      case "UNDER_INQUIRY":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "LEASED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "CREATED":
        return "Available for Inquiry";
      case "UNDER_INQUIRY":
        return "Currently Under Review";
      case "APPROVED":
        return "Inquiry Approved";
      case "REJECTED":
        return "Inquiry Rejected";
      case "LEASED":
        return "Property Leased";
      default:
        return status;
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
        return <Building2 className="w-4 h-4" />;
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-2">Browse available properties</p>
        </div>

        <Card className="mb-8 border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by title, location, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="residential-lot">Residential Lot</option>
                  <option value="commercial">Commercial</option>
                  <option value="house-and-lot">House and Lot</option>
                  <option value="condo">Condo</option>
                </select>
              </div>
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="CREATED">Available</option>
                  <option value="UNDER_INQUIRY">Under Inquiry</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="LEASED">Leased</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredProperties.length} of {properties.length}{" "}
            properties
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card
              key={property._id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-0">
                {property.images && property.images.length > 0 ? (
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                    <CustomCarousel
                      images={property.images}
                      alt={property.title}
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {property.title}
                    </h3>
                    <Badge className={getStatusColor(property.status)}>
                      {getStatusMessage(property.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{property.location}</span>
                  </div>

                  <div className="text-2xl font-bold text-green-600 mb-3">
                    ${property.price.toLocaleString()}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="w-4 h-4 mr-1" />
                      <span>
                        {property.type
                          .replace("-", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Square className="w-4 h-4 mr-1" />
                      <span>{property.size}</span>
                    </div>
                  </div>

                  {property.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {property.description}
                    </p>
                  )}

                  {property.amenities && property.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {property.amenities.slice(0, 3).map((amenity, index) => (
                        <div
                          key={index}
                          className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                        >
                          {getAmenityIcon(amenity)}
                          <span className="ml-1">
                            {amenity.replace("-", " ")}
                          </span>
                        </div>
                      ))}
                      {property.amenities.length > 3 && (
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          +{property.amenities.length - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => setSelectedProperty(property)}
                    className="w-full"
                    disabled={property.status !== "CREATED"}
                  >
                    {property.status === "CREATED"
                      ? "View Details & Inquire"
                      : "View Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No properties found matching your criteria.
            </p>
          </div>
        )}

        {selectedProperty && (
          <div className="fixed inset-0  bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">
                    {selectedProperty.title}
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProperty(null)}
                    className="ml-4"
                  >
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    {selectedProperty.images &&
                    selectedProperty.images.length > 0 ? (
                      <div className="mb-6">
                        <CustomCarousel
                          images={selectedProperty.images}
                          alt={selectedProperty.title}
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                        <Building2 className="w-16 h-16 text-gray-400" />
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-5 h-5 mr-2" />
                        <span className="text-lg">
                          {selectedProperty.location}
                        </span>
                      </div>

                      <div className="text-4xl font-bold text-green-600">
                        ${selectedProperty.price.toLocaleString()}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center text-gray-600">
                          <Building2 className="w-5 h-5 mr-2" />
                          <span>
                            {selectedProperty.type
                              .replace("-", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Square className="w-5 h-5 mr-2" />
                          <span>{selectedProperty.size}</span>
                        </div>
                      </div>

                      {selectedProperty.description && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3">
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
                            <h4 className="text-lg font-semibold mb-3">
                              Amenities
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              {selectedProperty.amenities.map(
                                (amenity, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center text-gray-600"
                                  >
                                    {getAmenityIcon(amenity)}
                                    <span className="ml-2 capitalize">
                                      {amenity.replace("-", " ")}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="lg:pl-6">
                    {selectedProperty.status === "CREATED" ? (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold">
                          Submit Inquiry
                        </h3>

                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        {successMessage && (
                          <Alert>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                              {successMessage}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div>
                          <Label htmlFor="fullName" className="text-base">
                            Full Name *
                          </Label>
                          <Input
                            id="fullName"
                            placeholder="Enter your full name"
                            value={inquiryForm.fullName}
                            onChange={(e) =>
                              handleInputChange("fullName", e.target.value)
                            }
                            className="mt-2 h-12"
                          />
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-base">
                            Email *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={inquiryForm.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className="mt-2 h-12"
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone" className="text-base">
                            Phone *
                          </Label>
                          <Input
                            id="phone"
                            placeholder="Enter your phone number"
                            value={inquiryForm.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            className="mt-2 h-12"
                          />
                        </div>

                        <div>
                          <Label htmlFor="reason" className="text-base">
                            Reason for Inquiry *
                          </Label>
                          <Textarea
                            id="reason"
                            placeholder="Explain why you're interested in this property..."
                            value={inquiryForm.reason}
                            onChange={(e) =>
                              handleInputChange("reason", e.target.value)
                            }
                            className="mt-2 min-h-[120px]"
                            rows={6}
                          />
                        </div>

                        <Button
                          onClick={() => handleSubmit(selectedProperty._id)}
                          className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base"
                          disabled={submitting}
                        >
                          {submitting ? "Submitting..." : "Submit Inquiry"}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Badge
                          className={`${getStatusColor(
                            selectedProperty.status
                          )} mb-6 text-base px-4 py-2`}
                        >
                          {getStatusMessage(selectedProperty.status)}
                        </Badge>
                        <p className="text-gray-500 text-lg">
                          This property is not available for new inquiries.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyListingPage;
