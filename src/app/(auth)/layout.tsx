import React, { Suspense } from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center ">
          <div className="text-center">Loading...</div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
};

export default layout;
