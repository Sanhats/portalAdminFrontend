"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

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
  duration = 4000,
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-500/20 border-green-500/30",
          text: "text-green-300",
          icon: <CheckCircle2 className="h-5 w-5 text-green-400" />,
        };
      case "error":
        return {
          bg: "bg-red-500/20 border-red-500/30",
          text: "text-red-300",
          icon: <XCircle className="h-5 w-5 text-red-400" />,
        };
      case "info":
        return {
          bg: "bg-blue-500/20 border-blue-500/30",
          text: "text-blue-300",
          icon: <Info className="h-5 w-5 text-blue-400" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg border min-w-[300px] max-w-md ${styles.bg} animate-in slide-in-from-right-5 fade-in duration-300`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
        <div className="flex-1">
          <p className={`font-medium ${styles.text}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

