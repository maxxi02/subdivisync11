"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, AlertTriangle, FileText, Clock } from "lucide-react";
import Image from "next/image";
import CustomCarousel from "./_components/announcement-carousel";
import { CustomModal, ModalContent } from "./_components/custom-modal";

// Types
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

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const ViewAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 12, // Reduced limit for better card layout
    pages: 1,
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch announcements
  const fetchAnnouncements = async (page = 1) => {
    try {
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/announcements?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch announcements");
      }
      setAnnouncements(data.announcements);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setError((error as Error).message || "Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [searchQuery]);

  // Get color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // Get relative time
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  // Filter announcements based on search query
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Community Announcements
              </h1>
              <p className="text-lg text-muted-foreground">
                Stay updated with the latest news and updates from our community
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full lg:w-80 text-base"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h3 className="text-sm font-medium text-destructive">
                  Error Occurred
                </h3>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No announcements found
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No announcements are currently available."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredAnnouncements.map((announcement) => (
              <article
                key={announcement._id}
                className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group cursor-pointer"
                onClick={() => {
                  setSelectedAnnouncement(announcement);
                  setViewModalOpen(true);
                }}
              >
                {/* Featured Image */}
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {announcement.images && announcement.images.length > 0 ? (
                    <Image
                      src={announcement.images[0].url || "/placeholder.svg"}
                      alt={announcement.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Priority Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge
                      className={`px-2 py-1 text-xs font-medium ${getPriorityColor(
                        announcement.priority
                      )}`}
                    >
                      {announcement.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Meta Information */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{getRelativeTime(announcement.scheduledDate)}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {announcement.category.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {announcement.title}
                  </h2>

                  {/* Content Preview */}
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {announcement.content}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex justify-center items-center mt-12 gap-4">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => fetchAnnouncements(pagination.page - 1)}
              className="px-6 py-2"
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
            </div>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchAnnouncements(pagination.page + 1)}
              className="px-6 py-2"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <CustomModal
        opened={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      >
        <ModalContent className="w-full max-w-[90vw] sm:max-w-4xl h-[90vh] max-h-[90vh] overflow-y-auto overflow-x-hidden fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-background p-6 rounded-lg">
          {selectedAnnouncement && (
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {getRelativeTime(selectedAnnouncement.scheduledDate)}
                    </span>
                    <span>•</span>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-foreground leading-tight break-words">
                  {selectedAnnouncement.title}
                </h2>

                <div className="flex items-center gap-3 break-words">
                  <Badge variant="secondary">
                    {selectedAnnouncement.category
                      .replace("-", " ")
                      .toUpperCase()}
                  </Badge>
                  <Badge
                    className={`${getPriorityColor(
                      selectedAnnouncement.priority
                    )}`}
                  >
                    {selectedAnnouncement.priority.toUpperCase()} PRIORITY
                  </Badge>
                </div>
              </div>

              {/* Featured Media */}
              {selectedAnnouncement.images &&
              selectedAnnouncement.images.length > 0 ? (
                <div className="bg-muted rounded-lg overflow-hidden">
                  <CustomCarousel
                    images={selectedAnnouncement.images.map((img) => img.url)}
                    height={400}
                    alt={selectedAnnouncement.title}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No images available</p>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="max-w-none">
                <p className="text-lg leading-relaxed text-foreground break-words whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>

              {/* Footer */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Published:{" "}
                      {formatDate(selectedAnnouncement.scheduledDate)}
                    </p>
                    {selectedAnnouncement.updated_at && (
                      <p>
                        Updated: {formatDate(selectedAnnouncement.updated_at)}
                      </p>
                    )}
                  </div>
                  <Button onClick={() => setViewModalOpen(false)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </ModalContent>
      </CustomModal>
    </div>
  );
};

export default ViewAnnouncementsPage;
