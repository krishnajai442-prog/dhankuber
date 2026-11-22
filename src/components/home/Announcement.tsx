"use client";

import { X, AlertTriangle, CheckCircle } from "lucide-react";
import { clsx } from "clsx";

interface AnnouncementProps {
  type: "red" | "green";
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Announcement({ type, message, dismissible = false, onDismiss }: AnnouncementProps) {
  const configs = {
    red: {
      bg: "bg-danger-50",
      border: "border-danger-200",
      text: "text-danger-700",
      icon: AlertTriangle,
      iconColor: "text-danger-600",
      label: "Important Notice",
    },
    green: {
      bg: "bg-success-50",
      border: "border-success-200",
      text: "text-success-700",
      icon: CheckCircle,
      iconColor: "text-success-600",
      label: "Update",
    },
  };

  const config = configs[type];

  return (
    <div
      className={clsx(
        "w-full px-4 py-2 border-b",
        config.bg,
        config.border,
        config.text
      )}
      role="status"
      aria-live="polite"
    >
      <div className="container mx-auto flex items-center gap-3">
        <config.icon className={clsx("w-5 h-5 flex-shrink-0", config.iconColor)} aria-hidden="true" />
        <span className="text-sm font-medium">{config.label}: </span>
        <span className="text-sm flex-1">{message}</span>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={clsx("p-1 rounded hover:bg-gray-200 transition-colors", config.iconColor.replace("600", "500"))}
            aria-label="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function AnnouncementBar({ announcements }: { announcements: Array<{ type: "red" | "green"; message: string }> }) {
  return (
    <div className="w-full" aria-label="Announcements">
      {announcements.map((announcement, index) => (
        <Announcement key={index} type={announcement.type} message={announcement.message} />
      ))}
    </div>
  );
}