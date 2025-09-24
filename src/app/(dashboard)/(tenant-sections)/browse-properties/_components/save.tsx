"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Wifi,
  Dumbbell,
  Shield,
  Trees,
  AlertCircle,
  CheckCircle,
  Search,
} from "lucide-react";

// Alert component inline implementation
const Alert = ({ children, variant = "default", className = "" }: any) => {
  const variantStyles =
    variant === "destructive"
      ? "border-red-200 bg-red-50"
      : "border-gray-200 bg-white";
  return (
    <div className={`rounded-lg border p-4 ${variantStyles} ${className}`}>
      {children}
    </div>
  );
};

const AlertDescription = ({ children, className = "" }: any) => {
  return <div className={`text-sm ${className}`}>{children}</div>;
};

// Mock CustomCarousel component
const CustomCarousel = ({ images, height, alt }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="relative w-full" style={{ height }}>
      <img
        src={
          images[currentIndex] ||
          "https://via.placeholder.com/800x400?text=Property+Image"
        }
        alt={alt}
        className="w-full h-full object-cover"
      />
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_: any, index: number) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? "bg-white" : "bg-white/50"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
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
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

interface InquiryRequest {
  propertyId: string;
  fullName: string;
  email: string;
  phone: string;
  reason: string;
}

const PropertyDisplaySection = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  const [inquiryForm, setInquiryForm] = useState<InquiryRequest>({
    propertyId: "",
    fullName: "",
    email: "",
    phone: "",
    reason: "",
  });

  // Fetch all properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/properties", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch properties");
        }

        setProperties(data.properties || []);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError((err as Error).message || "Failed to fetch properties");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleInputChange = (field: keyof InquiryRequest, value: string) => {
    setInquiryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitInquiry = async () => {
    setError(null);
    setSuccessMessage(null);

    const requiredFields: (keyof InquiryRequest)[] = [
      "fullName",
      "email",
      "reason",
    ];
    const missingFields = requiredFields.filter((field) => !inquiryForm[field]);

    if (missingFields.length > 0) {
      setError(
        `Please fill in all required fields: ${missingFields
          .map((f) => f.charAt(0).toUpperCase() + f.slice(1))
          .join(", ")}`
      );
      return;
    }

    if (selectedProperty?.status !== "CREATED") {
      setError("This property is not available for new inquiries");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: selectedProperty._id,
          fullName: inquiryForm.fullName,
          email: inquiryForm.email,
          phone: inquiryForm.phone,
          reason: inquiryForm.reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to submit inquiry");
      }

      // Update property status locally
      setProperties((prevProperties) =>
        prevProperties.map((prop) =>
          prop._id === selectedProperty._id
            ? { ...prop, status: "UNDER_INQUIRY" }
            : prop
        )
      );

      setSuccessMessage(
        "Your inquiry has been submitted successfully! The property owner will review it soon."
      );

      setInquiryForm({
        propertyId: "",
        fullName: "",
        email: "",
        phone: "",
        reason: "",
      });

      setTimeout(() => {
        setShowInquiryModal(false);
        setSuccessMessage(null);
      }, 3000);
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
        return "Available";
      case "UNDER_INQUIRY":
        return "Under Review";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      case "LEASED":
        return "Leased";
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

  const filteredProperties = properties.filter(
    (property) =>
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (error && properties.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Available Properties
          </h1>
          <p className="text-gray-600">
            Browse and inquire about available properties
          </p>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by title, location, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full md:w-96"
          />
        </div>

        {filteredProperties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No properties found
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "No properties are currently available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card
                key={property._id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gray-100 relative">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <Badge
                    className={`absolute top-2 right-2 ${getStatusColor(
                      property.status
                    )}`}
                  >
                    {getStatusMessage(property.status)}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{property.title}</CardTitle>
                  <CardDescription className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-600">
                        ${property.price.toLocaleString()}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {property.type.replace("-", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Square className="w-4 h-4 mr-1" />
                        {property.size}
                      </div>
                      {property.bedrooms && property.bedrooms > 0 && (
                        <div className="flex items-center">
                          <Bed className="w-4 h-4 mr-1" />
                          {property.bedrooms} BR
                        </div>
                      )}
                      {property.bathrooms && property.bathrooms > 0 && (
                        <div className="flex items-center">
                          <Bath className="w-4 h-4 mr-1" />
                          {property.bathrooms} BA
                        </div>
                      )}
                    </div>
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {property.amenities
                          .slice(0, 3)
                          .map((amenity, index) => (
                            <div
                              key={index}
                              className="flex items-center text-xs text-gray-600"
                            >
                              {getAmenityIcon(amenity)}
                              <span className="ml-1">
                                {amenity
                                  .replace("-", " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </span>
                            </div>
                          ))}
                        {property.amenities.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{property.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    <Button
                      onClick={() => {
                        setSelectedProperty(property);
                        setShowInquiryModal(true);
                        setInquiryForm({
                          propertyId: property._id,
                          fullName: "",
                          email: "",
                          phone: "",
                          reason: "",
                        });
                      }}
                      className="w-full"
                      disabled={property.status !== "CREATED"}
                    >
                      {property.status === "CREATED"
                        ? "Make Inquiry"
                        : getStatusMessage(property.status)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Inquiry Modal */}
      {showInquiryModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">
                {selectedProperty.title}
              </h2>
              <p className="text-gray-600 mb-6 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {selectedProperty.location}
              </p>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="border-green-200 bg-green-50 mb-4">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={inquiryForm.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={inquiryForm.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={inquiryForm.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason for Inquiry *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why you're interested in this property..."
                    value={inquiryForm.reason}
                    onChange={(e) =>
                      handleInputChange("reason", e.target.value)
                    }
                    rows={4}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmitInquiry}
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Inquiry"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInquiryModal(false);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDisplaySection;
