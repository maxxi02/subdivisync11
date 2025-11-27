// src/components/AuthLayout.tsx
"use client";
import type React from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [key, setKey] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Force remount and restart animation when pathname changes
    setKey((prev) => prev + 1);
  }, [pathname]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center auth-gradient-bg">
      <style jsx>{`
        .auth-gradient-bg {
          background: linear-gradient(150deg, #39ff6c, #0062c1);
          background-size: 400% 400%;
          animation: AuthGradientAnimation 11s ease infinite;
        }
        @keyframes AuthGradientAnimation {
          0% { background-position: 34% 0%; }
          50% { background-position: 67% 100%; }
          100% { background-position: 34% 0%; }
        }
      `}</style>
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
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 px-6 py-12 w-full max-w-7xl mx-auto">
        {/* Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">{children}</div>

        {/* Right Side Content */}
        <div className="hidden lg:flex flex-col justify-center text-white max-w-lg">
          <h1
            key={key}
            className="text-6xl font-bold leading-tight mb-8 font-sans"
            style={{ fontFamily: 'var(--font-manrope)' }}
          >
            <span
              className="inline-block"
              style={{
                animation: 'popUp 0.7s ease-out 0.1s forwards',
                opacity: 0,
              }}
            >
              Secure.
            </span>
            <br />
            <span
              className="inline-block"
              style={{
                animation: 'popUp 0.7s ease-out 0.3s forwards',
                opacity: 0,
              }}
            >
              Simple.
            </span>
            <br />
            <span
              className="inline-block"
              style={{
                animation: 'popUp 0.7s ease-out 0.5s forwards',
                opacity: 0,
              }}
            >
              Subdivisync.
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
}
