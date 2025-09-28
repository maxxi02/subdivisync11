"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Building2,
  ChevronDown,
  Users,
  Shield,
  Globe,
  ArrowRight,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: "low" | "medium" | "high";
  scheduledDate: string;
  images: { url: string; publicId: string }[];
  created_by: string;
  created_at: string;
  updated_at?: string;
}

const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = announcement.images;

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () =>
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  const priorityColor = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  }[announcement.priority];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {images.length === 0 ? (
          <div className="w-full h-48 bg-purple-100" />
        ) : (
          <>
            <div className="overflow-hidden w-full h-80">
              <div
                className="flex transition-transform duration-300"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {images.map((img) => (
                  <Image
                    width={500}
                    height={500}
                    key={img.publicId}
                    src={img.url}
                    alt={announcement.title}
                    className="w-full h-80 object-cover flex-shrink-0"
                  />
                ))}
              </div>
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 p-1 rounded-full hover:bg-white/90"
                >
                  <ArrowLeftIcon />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 p-1 rounded-full hover:bg-white/90"
                >
                  <ArrowRightIcon />
                </button>
              </>
            )}
          </>
        )}
        <Badge className="absolute top-3 left-3 bg-blue-600 text-white">
          {announcement.category}
        </Badge>
        <Badge className={`absolute top-3 right-3 ${priorityColor} text-white`}>
          {announcement.priority}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">
          {announcement.title}
        </h3>
        <p className="text-gray-500 text-sm leading-5 mb-2">
          {announcement.content}
        </p>
        <div className="text-sm text-gray-400">
          Posted on {new Date(announcement.scheduledDate).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const router = useRouter();
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcements");
        const data = await response.json();
        if (data.success) {
          const currentDate = new Date("2025-09-28");
          const filtered = data.announcements.filter(
            (ann: Announcement) => new Date(ann.scheduledDate) <= currentDate
          );
          filtered.sort(
            (a: Announcement, b: Announcement) =>
              new Date(b.scheduledDate).getTime() -
              new Date(a.scheduledDate).getTime()
          );
          setAnnouncements(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch announcements");
      }
    };
    fetchAnnouncements();
  }, []);

  const propertyTypes = [
    { icon: Home, label: "House", count: "2340 PROPERTIES" },
    { icon: Building2, label: "Villa", count: "2145 PROPERTIES" },
    { icon: Building2, label: "Condo", count: "924 PROPERTIES" },
  ];

  const differentiators = [
    {
      icon: Users,
      title: "Expert Advice",
      description:
        "Our property has been designed with attention to every detail, both commercial and client.",
    },
    {
      icon: Shield,
      title: "Exclusive Property",
      description:
        "All our properties have been designed to be exclusive to every client, both commercial and client.",
    },
    {
      icon: Globe,
      title: "Global Network",
      description:
        "Access to our extensive network of properties worldwide with local expertise.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Subdivisync{" "}
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#"
                className="text-gray-900 font-medium hover:text-blue-600"
              >
                Home
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600">
                For Rent
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600">
                For Buy
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600">
                Services
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600">
                About Us
              </a>
            </nav>

            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                className="text-gray-600"
                onClick={() => router.push("/login")}
              >
                Log In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight text-balance">
                  Find a Perfect Property to Suit Your Lifestyle
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Seamlessly blend life and living. Discover a property that
                  complements your rhythm, turning every moment into a
                  reflection of your lifestyle.
                </p>
              </div>

              {/* Property Types */}
              <div className="flex flex-wrap gap-4">
                {propertyTypes.map((type, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm border"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <type.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {type.label}
                      </div>
                      <div className="text-sm text-gray-500">{type.count}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-gray-500 mb-2">Scroll down to explore</p>
                <ChevronDown className="w-5 h-5 text-gray-400 mx-auto animate-bounce" />
              </div>
            </div>

            <div className="relative">
              <Image
                width={500}
                height={500}
                src="/modern-house.jpg"
                alt="Modern luxury property"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Announcements</h2>
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-700"
            >
              See More <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement._id}
                announcement={announcement}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Properties */}
      {/* <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Popular Property
            </h2>
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-700"
            >
              See More <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProperties.map((property) => (
              <Card
                key={property.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-3 left-3 bg-blue-600 text-white">
                    {property.type}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {property.title}
                    </h3>
                    <span className="text-lg font-bold text-blue-600">
                      {property.price}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.location}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">4.8</span>
                    </div>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900 text-balance">
                Take a big step into the future of living
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Our approach goes beyond transactions through transparent
                dealings, ethical practices, and a genuine commitment to client
                satisfaction. We prioritize building lasting relationships over
                quick sales ventures. With a rich legacy of excellence, we have
                consistently surpassed industry standards to redefine the art of
                property acquisition and sales.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6 text-center bg-blue-600 text-white">
                <div className="text-3xl font-bold mb-2">3500+</div>
                <div className="text-blue-100">Happy Customer</div>
              </Card>
              <Card className="p-6 text-center bg-gray-900 text-white">
                <div className="text-3xl font-bold mb-2">15+</div>
                <div className="text-gray-300">Years Experience</div>
              </Card>
              <Card className="p-6 text-center border-2 border-gray-200">
                <div className="text-3xl font-bold mb-2 text-gray-900">
                  10,000+
                </div>
                <div className="text-gray-600">Property Ready</div>
              </Card>
              <Card className="p-6 text-center border-2 border-gray-200">
                <div className="text-3xl font-bold mb-2 text-gray-900">
                  500+
                </div>
                <div className="text-gray-600">Financing Assistance</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              What are Our Differentiation?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Our properties has been designed with attention to every detail,
              both commercial and client.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {differentiators.map((item, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700 p-6">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Subdivisync</span>
              </div>
              <p className="text-gray-400">
                Your trusted partner in finding the perfect property that suits
                your lifestyle.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Properties
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Buy Property
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Rent Property
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Property Management
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Investment
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>123 Real Estate St.</li>
                <li>City, State 12345</li>
                <li>Phone: (555) 123-4567</li>
                <li>Email: info@Subdivisync.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Subdivisync. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
