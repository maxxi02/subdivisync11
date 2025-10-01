"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { IconPhoto } from "@tabler/icons-react";

interface ServiceRequestCarouselProps {
  images: string[];
  alt: string;
  showIndicators?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const ServiceRequestCarousel: React.FC<ServiceRequestCarouselProps> = ({
  images,
  alt,
  showIndicators = false,
  autoPlay = false,
  autoPlayInterval = 4000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Handle auto-play
  useEffect(() => {
    if (!autoPlay || isHovered || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlay, isHovered, autoPlayInterval, images.length]);

  // Navigate to previous image
  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Navigate to next image
  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  // Navigate to specific image
  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
        <IconPhoto size={48} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-48 rounded-lg overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Image carousel"
    >
      {/* Image */}
      <div className="relative w-full h-full">
        <Image
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          fill
          className="object-cover"
          priority={currentIndex === 0}
          onError={() => (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <IconPhoto size={48} className="text-gray-400" />
            </div>
          )}
        />
      </div>

      {/* Navigation Buttons (shown only if multiple images and hovered) */}
      {images.length > 1 && (
        <div
          className={`absolute inset-0 flex items-center justify-between px-4 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={prevImage}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextImage}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Indicators */}
      {showIndicators && images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                index === currentIndex
                  ? "bg-blue-500 w-4"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceRequestCarousel;
