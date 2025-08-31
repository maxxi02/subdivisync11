"use client";
import { useState, useEffect, useRef } from "react";
import type React from "react";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [showVideo, setShowVideo] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnded = () => {
      setShowVideo(false);

      setTimeout(() => {
        setShowVideo(true);
        video.currentTime = 0;
        video.play();
      }, 60000);
    };

    return () => {
      video.removeEventListener("ended", handleVideoEnded);
    };
  }, []);

  // Show loading screen while checking authentication
  if (isPending) {
    return (
      <div className="relative h-screen w-full overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
        }}
      />

      {loading && (
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600" />
      )}

      <div className="absolute inset-0 bg-black/40 z-5"></div>

      <div className="relative z-10 flex items-center justify-center h-full p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 max-w-6xl w-full">
          <div className="flex-shrink-0">
            {children}

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
                <p className="text-red-700 text-sm text-center">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
