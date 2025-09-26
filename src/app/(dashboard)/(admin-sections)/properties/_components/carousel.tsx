import { ImageDown } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

interface CustomCarouselProps {
  images?: string[];
  height?: number;
  alt?: string;
}

const CustomCarousel = ({
  images,
  height = 200,
  alt = "",
}: CustomCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: `${height}px`,
          backgroundColor: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6c757d",
          borderRadius: "8px",
        }}
      >
        No Image Available
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: `${height}px`,
          backgroundColor: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6c757d",
          borderRadius: "8px",
        }}
      >
        No Image Available
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <Image
        width={500}
        height={500}
        src={images[0]}
        alt={alt}
        style={{
          width: "100%",
          height: `${height}px`,
          objectFit: "cover",
          borderRadius: "8px",
        }}
        onError={(e) => {
          e.currentTarget.src =
            "https://via.placeholder.com/400x200?text=No+Image";
        }}
      />
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
      {/* Main Image */}
      <Image
        width={500}
        height={500}
        src={images[currentIndex]}
        alt={`${alt} - Image ${currentIndex + 1}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "8px",
        }}
        onError={(e) => {
          e.currentTarget.src =
            "https://via.placeholder.com/400x200?text=No+Image";
        }}
      />

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            }}
          >
            ‹
          </button>

          <button
            onClick={nextSlide}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            }}
          >
            ›
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "15px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "8px",
            zIndex: 2,
          }}
        >
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                border: "2px solid white",
                backgroundColor:
                  index === currentIndex ? "white" : "transparent",
                cursor: "pointer",
                opacity: index === currentIndex ? 1 : 0.7,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.opacity =
                  index === currentIndex ? "1" : "0.7";
              }}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "500",
            zIndex: 2,
          }}
        >
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default CustomCarousel;
