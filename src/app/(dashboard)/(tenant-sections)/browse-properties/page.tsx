"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  IconMapPin,
  IconStar,
  IconBed,
  IconBath,
  IconRuler,
  IconSmokingNo,
  IconToolsKitchen2,
  IconBuilding,
  IconWifi,
  IconCar,
} from "@tabler/icons-react";
import { Label } from "@/components/ui/label";

// Property interface (aligned with API)
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
  fullName: string;
  email: string;
  phone: string;
  message: string;
  propertyId: string;
}

const PropertyDetailSection = ({ propertyId }: { propertyId: string }) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId || propertyId === "undefined") {
        setError("Invalid or missing property ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/properties/${propertyId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (!data.success || !data.property) {
          throw new Error(data.error || "Property not found");
        }
        setProperty({
          ...data.property,
          price: parseFloat(data.property.price.toString()),
          created_at: new Date(data.property.created_at),
          updated_at: data.property.updated_at
            ? new Date(data.property.updated_at)
            : undefined,
        });
      } catch (err) {
        setError((err as Error).message || "Failed to fetch property");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);
  
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const requiredFields = ["fullName", "email", "phone"];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      setError(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const inquiryData: InquiryRequest = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        message: formData.message || "N/A",
        propertyId,
      };

      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inquiryData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(
          data.message || "Your inquiry has been submitted successfully!"
        );
        resetForm();
      } else {
        setError(data.error || "Failed to submit inquiry");
      }
    } catch (err) {
      setError("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  // Amenity to icon mapping
  const amenityIconMap: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    beds: IconBed,
    baths: IconBath,
    "sq ft": IconRuler,
    "smoking area": IconSmokingNo,
    kitchen: IconToolsKitchen2,
    balcony: IconBuilding,
    wifi: IconWifi,
    "parking area": IconCar,
  };

  const amenities =
    property?.amenities?.map((amenity) => ({
      icon: amenityIconMap[amenity.toLowerCase()] || IconBuilding,
      label: amenity,
    })) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error || "Property not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Images and Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main large image */}
              <div className="md:col-span-2">
                <div className="relative h-80 md:h-96 overflow-hidden rounded-lg">
                  <img
                    src={property.images?.[0] || "/placeholder.svg"}
                    alt={`${property.title} Main View`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Side images */}
              <div className="space-y-4">
                <div className="relative h-[185px] overflow-hidden rounded-lg">
                  <img
                    src={property.images?.[1] || "/placeholder.svg"}
                    alt={`${property.title} Side View`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative h-[185px] overflow-hidden rounded-lg bg-gray-800 flex items-center justify-center">
                  <img
                    src={property.images?.[2] || "/placeholder.svg"}
                    alt="More Views"
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {property.images?.length || 0}+
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {property.title}
                </h1>
                <div className="flex items-center text-gray-600 mb-2">
                  <IconMapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{property.location}</span>
                </div>
                <div className="flex items-center mb-4">
                  <div className="flex items-center mr-4">
                    {[...Array(5)].map((_, i) => (
                      <IconStar
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-current"
                      />
                    ))}
                    <span className="ml-1 text-sm text-gray-600">5.0</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ${property.price.toLocaleString()}{" "}
                  <span className="text-lg font-normal text-gray-600">USD</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description:</h3>
                <p className="text-gray-600 leading-relaxed">
                  {property.description || "No description available"}
                </p>
              </div>

              {/* Key Features */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Key Features:</h3>

                {/* Amenities Grid */}
                <div className="bg-white rounded-lg p-6 border">
                  <h4 className="font-medium mb-4">Amenities</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm text-gray-600"
                      >
                        <amenity.icon className="w-4 h-4" />
                        <span>{amenity.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Areas & Lot */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Areas & Lot</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="font-medium">{property.status}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="text-sm text-gray-600">Availability</div>
                    <div className="font-medium">
                      {property.status === "CREATED"
                        ? "Available"
                        : "Not Available"}
                    </div>
                  </div>
                  {(property.type === "house-and-lot" ||
                    property.type === "condo") && (
                    <>
                      {property.bedrooms && (
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="text-sm text-gray-600">Bedrooms</div>
                          <div className="font-medium">{property.bedrooms}</div>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="text-sm text-gray-600">Bathrooms</div>
                          <div className="font-medium">
                            {property.bathrooms}
                          </div>
                        </div>
                      )}
                      {property.sqft && (
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="text-sm text-gray-600">
                            Square Footage
                          </div>
                          <div className="font-medium">
                            {property.sqft} sq ft
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Contact Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                {/* Agent Info */}
                <div className="flex items-center space-x-3 mb-6">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/professional-real-estate-agent.png" />
                    <AvatarFallback>AR</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">Alex Ripon</div>
                    <div className="text-sm text-gray-600">
                      example@gmail.com
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="fullName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="yourmail@gmail.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="phone"
                      className="text-sm font-medium text-gray-700"
                    >
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+880"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="message"
                      className="text-sm font-medium text-gray-700"
                    >
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Write here..."
                      value={formData.message}
                      onChange={(e) =>
                        handleInputChange("message", e.target.value)
                      }
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  {successMessage && (
                    <div className="text-green-500 text-sm">
                      {successMessage}
                    </div>
                  )}

                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    disabled={submitting || property.status !== "CREATED"}
                  >
                    {submitting ? "Submitting..." : "Submit Inquiry"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailSection;
