"use client";

import ErrorPage from "@/components/ErrorPage";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error capturado:", error);
  }, [error]);

  return (
    <div>
      <ErrorPage statusCode={500} message={error.message || "Algo salió mal"} />
      <div className="text-center mt-4">
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}

