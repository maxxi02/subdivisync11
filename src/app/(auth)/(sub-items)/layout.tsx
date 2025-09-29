// src/components/AuthLayout.tsx
"use client";
import type React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent transform rotate-12 scale-150"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Diagonal lines pattern */}
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id="diagonalLines"
                patternUnits="userSpaceOnUse"
                width="20"
                height="20"
              >
                <path
                  d="M0,20 L20,0"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.5"
                />
                <path
                  d="M0,0 L20,20"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonalLines)" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-between px-6 py-12 max-w-7xl mx-auto min-h-[calc(100vh-120px)]">
        {/* Login Form */}
        <div className="w-full max-w-md">{children}</div>

        {/* Right Side Content */}
        <div className="hidden lg:flex flex-col justify-center text-white max-w-lg ml-12">
          <h1 className="text-6xl font-bold leading-tight mb-8">
            Everything
            <br />
            <span className="text-blue-100">Property</span>
            <br />
            Managers
          </h1>

          {/* Play button and description */}
          <div className="flex items-center gap-4 mt-8">
            <button className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <svg
                className="w-5 h-5 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <div className="text-sm text-blue-100">
              <p>See how it works and get started in</p>
              <p>under 2 minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
