"use client";

import { Download } from "lucide-react";

interface Props {
  companyId: string;
  companyName: string;
}

export function ExportJsonButton({ companyId, companyName }: Props) {
  return (
    <a
      href={`/api/export/${companyId}`}
      download={`${companyName}-export.json`}
      className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
      title="Export all company data as JSON"
    >
      <Download className="w-3.5 h-3.5" />
      Export JSON
    </a>
  );
}
