// lib/utils/notifications.ts - Notification utilities
import { notifications } from "@mantine/notifications";
import { Check, X, AlertCircle, Info } from "lucide-react";

export const showNotification = {
  success: (message: string, title = "Success") => {
    notifications.show({
      title,
      message,
      color: "green",
      icon: <Check size={16} />,
    });
  },
  error: (message: string, title = "Error") => {
    notifications.show({
      title,
      message,
      color: "red",
      icon: <X size={16} />,
    });
  },
  warning: (message: string, title = "Warning") => {
    notifications.show({
      title,
      message,
      color: "orange",
      icon: <AlertCircle size={16} />,
    });
  },
  info: (message: string, title = "Info") => {
    notifications.show({
      title,
      message,
      color: "blue",
      icon: <Info size={16} />,
    });
  },
};
