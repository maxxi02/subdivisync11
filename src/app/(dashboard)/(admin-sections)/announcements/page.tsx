"use client";
import { getServerSession } from "@/better-auth/action";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

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

const AnnouncementCard = ({
  announcement,
  onEdit,
  onDelete,
}: {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = announcement.images;

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () =>
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="max-w-7xl rounded-md bg-white shadow-sm border border-gray-100">
      {images.length === 0 ? (
        <div className="w-full h-[150px] bg-[#EFCDFF]" />
      ) : (
        <div className="relative">
          <div className="overflow-hidden w-full h-[500px]">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {images.map((image) => (
                <Image
                  width={500}
                  height={500}
                  key={image.publicId}
                  src={image.url}
                  alt={announcement.title}
                  className="w-full h-[500px] object-cover flex-shrink-0"
                />
              ))}
            </div>
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-1 hover:bg-white/90 text-black"
              >
                <IconChevronLeft />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-1 hover:bg-white/90 text-black"
              >
                <IconChevronRight />
              </button>
            </>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="text-gray-900 text-lg font-semibold leading-7">
          {announcement.title}
        </h3>
        <p className="mt-2 text-gray-500 text-sm leading-5">
          {announcement.content}
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Category:{" "}
          <Badge className="bg-blue-500/90 border-none text-black">
            {announcement.category}
          </Badge>{" "}
          | Priority:{" "}
          <Badge className="bg-blue-500/90 border-none text-black">
            {announcement.priority}
          </Badge>{" "}
          | Scheduled:{" "}
          <Badge className="bg-blue-500/90 border-none text-black">
            {new Date(announcement.scheduledDate).toLocaleDateString()}
          </Badge>
          {new Date(announcement.scheduledDate).toLocaleDateString()}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onEdit(announcement)}
            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(announcement._id)}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ManageAnnouncementSection = () => {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    content: "",
    category: "",
    priority: "low" as "low" | "medium" | "high",
    scheduledDate: "",
    images: [] as File[],
    imagesToDelete: [] as string[],
  });
  const [isEditing, setIsEditing] = useState(false);

  // Check admin access
  useEffect(() => {
    const checkSession = async () => {
      const session = await getServerSession();
      if (!session || session.user.role !== "admin") {
        setIsAdmin(false);
        router.push("/dashboard");
      } else {
        setIsAdmin(true);
      }
    };
    checkSession();
  }, [router]);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/announcements?public=false");
        const data = await response.json();
        if (data.success) {
          setAnnouncements(data.announcements);
        } else {
          setError(data.error || "Failed to fetch announcements");
        }
      } catch (err) {
        setError("An error occurred while fetching announcements");
      } finally {
        setIsLoading(false);
      }
    };
    if (isAdmin) {
      fetchAnnouncements();
    }
  }, [isAdmin]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input for images
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...Array.from(files)],
      }));
    }
  };

  // Handle image deletion
  const handleRemoveImage = (publicId: string) => {
    setFormData((prev) => ({
      ...prev,
      imagesToDelete: [...prev.imagesToDelete, publicId],
      images: prev.images.filter(
        (_, i) => !prev.imagesToDelete.includes(publicId)
      ),
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      content: "",
      category: "",
      priority: "low",
      scheduledDate: "",
      images: [],
      imagesToDelete: [],
    });
    setIsEditing(false);
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const form = new FormData();
    form.append("title", formData.title);
    form.append("content", formData.content);
    form.append("category", formData.category);
    form.append("priority", formData.priority);
    form.append("scheduledDate", formData.scheduledDate);
    if (isEditing) {
      form.append("id", formData.id);
      form.append("imagesToDelete", JSON.stringify(formData.imagesToDelete));
    }
    formData.images.forEach((image) => form.append("images", image));

    try {
      const url = isEditing ? "/api/announcements" : "/api/announcements";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        body: form,
      });
      const data = await response.json();

      if (data.success) {
        // Update local state
        if (isEditing) {
          setAnnouncements((prev) =>
            prev.map((ann) =>
              ann._id === data.announcement._id ? data.announcement : ann
            )
          );
        } else {
          setAnnouncements((prev) => [data.announcement, ...prev]);
        }
        resetForm();
      } else {
        setError(data.error || "Failed to save announcement");
      }
    } catch (err) {
      setError("An error occurred while saving the announcement");
    } 
  };

  // Handle edit button click
  const handleEdit = (announcement: Announcement) => {
    setFormData({
      id: announcement._id,
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      priority: announcement.priority,
      scheduledDate: new Date(announcement.scheduledDate)
        .toISOString()
        .split("T")[0],
      images: [],
      imagesToDelete: [],
    });
    setIsEditing(true);
  };

  // Handle delete button click
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const response = await fetch(`/api/announcements?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        setAnnouncements((prev) => prev.filter((ann) => ann._id !== id));
      } else {
        setError(data.error || "Failed to delete announcement");
      }
    } catch (err) {
      setError("An error occurred while deleting the announcement");
    }
  };

  if (!isAdmin) {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Announcements</h1>

      {/* Create/Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 bg-white p-6 rounded shadow"
      >
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? "Edit Announcement" : "Create Announcement"}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border rounded p-2"
            rows={4}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium">
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="priority" className="block text-sm font-medium">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="scheduledDate" className="block text-sm font-medium">
            Scheduled Date
          </label>
          <input
            type="date"
            id="scheduledDate"
            name="scheduledDate"
            value={formData.scheduledDate}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="images" className="block text-sm font-medium">
            Images
          </label>
          <input
            type="file"
            id="images"
            name="images"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            multiple
            onChange={handleFileChange}
            className="mt-1 block w-full"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.images.map((file, index) => (
              <div key={index} className="relative">
                <Image
                  width={500}
                  height={500}
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index}`}
                  className="w-24 h-24 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index),
                    }))
                  }
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  &times;
                </button>
              </div>
            ))}
            {isEditing &&
              announcements
                .find((ann) => ann._id === formData.id)
                ?.images.filter(
                  (img) => !formData.imagesToDelete.includes(img.publicId)
                )
                .map((image) => (
                  <div key={image.publicId} className="relative">
                    <Image
                      width={500}
                      height={500}
                      src={image.url}
                      alt="Existing image"
                      className="w-24 h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.publicId)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      &times;
                    </button>
                  </div>
                ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isEditing ? "Update" : "Create"} Announcement
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Announcements List */}
      <h2 className="text-xl font-semibold mb-4">Announcements</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : announcements.length === 0 ? (
        <p>No announcements found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement._id}
              announcement={announcement}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageAnnouncementSection;
