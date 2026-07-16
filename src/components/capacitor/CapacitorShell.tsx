"use client";

import { useEffect } from "react";
import { bootstrapCapacitor } from "@/lib/capacitor/bootstrap";

export function CapacitorShell() {
  useEffect(() => {
    void bootstrapCapacitor();
  }, []);

  return null;
}
