"use client";

import { useEffect, useRef } from "react";
import { useToastManager } from "@/components/ui/toast";

export function AuthErrorToast({
  message,
  type = "error",
}: {
  message: string;
  type?: "error" | "info";
}) {
  const { add } = useToastManager();
  const lastMessage = useRef<string | null>(null);

  useEffect(() => {
    if (lastMessage.current !== message) {
      lastMessage.current = message;
      add({ type, title: message });
    }
  }, [add, message, type]);

  return null;
}
