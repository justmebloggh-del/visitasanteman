"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function PrintButton() {
  return <Button type="button" variant="outline" onClick={() => window.print()} className="no-print"><Printer className="size-4" aria-hidden />Print or save as PDF</Button>;
}
