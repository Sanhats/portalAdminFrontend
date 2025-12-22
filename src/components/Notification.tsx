"use client";

import { useEffect } from "react";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Notification({
  message,
  type,
  onClose,
  duration = 3000,
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === "success"
      ? "text-green-700"
      : type === "error"
      ? "text-red-700"
      : "text-blue-700";

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg neu-elevated min-w-[300px] max-w-md ${bgColor}`}
    >
      <div className="flex justify-between items-start">
        <p className="font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-muted-foreground hover:text-foreground neu-flat rounded-md px-2 py-1 neu-active"
        >
          ×
        </button>
      </div>
    </div>
  );
}

