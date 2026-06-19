"use client";

import { useState, useTransition } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { fetchReportData } from "@/lib/actions/report";

interface Props {
  companyId?: string;
  label?: string;
}

export function DownloadReportButton({ companyId, label = "Download Report" }: Props) {
  const [isPending, start] = useTransition();
  const [error, setError]  = useState<string | null>(null);

  function handleDownload() {
    setError(null);
    start(async () => {
      const data = await fetchReportData(companyId);
      if ("error" in data) { setError(data.error); return; }

      // Dynamic import to keep jsPDF out of SSR bundle
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      let y = 18;

      // ── Header ──
      doc.setFillColor(91, 33, 182); // Primary purple
      doc.rect(0, 0, W, 28, "F");
      doc.setFontSize(18); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
      doc.text("Monthly Performance Report", 14, 16);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`Generated ${new Date(data.generatedAt).toLocaleDateString()} · ${data.company.name}`, 14, 24);
      y = 38;

      // ── Summary ──
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text("Summary", 14, y); y += 6;

      const summaryRows = [
        ["Employees", String(data.summary.totalEmployees)],
        ["Managers", String(data.summary.totalManagers)],
        ["Lessons Completed", String(data.summary.totalLessonsCompleted)],
        ["Total Sales", `${data.summary.totalSalesAmount.toLocaleString()} SAR`],
        ["Avg XP / Employee", String(data.summary.avgXP)],
      ];

      autoTable(doc, {
        startY: y,
        head: [["Metric", "Value"]],
        body: summaryRows,
        theme: "grid",
        headStyles: { fillColor: [91, 33, 182] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
        columnStyles: { 1: { halign: "right" } },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

      // ── Employee Rankings ──
      if (y > pageH - 40) { doc.addPage(); y = 18; }
      doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Employee Rankings", 14, y); y += 6;
      autoTable(doc, {
        startY: y,
        head: [["#", "Name", "Level", "XP", "Streak", "Lessons", "Certs"]],
        body: data.employees.map((e, i) => [
          i + 1, e.name, e.level, e.points.toLocaleString(),
          `${e.currentStreak}d`, e.lessonsCompleted, e.certificatesEarned,
        ]),
        theme: "striped",
        headStyles: { fillColor: [91, 33, 182] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

      // ── Course Completion ──
      if (data.courses.length > 0) {
        if (y > pageH - 40) { doc.addPage(); y = 18; }
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Course Completion", 14, y); y += 6;
        autoTable(doc, {
          startY: y,
          head: [["Course", "Completions", "Enrolled", "Rate"]],
          body: data.courses.map((c) => [
            c.title, c.completions, c.totalEnrolled,
            c.totalEnrolled > 0 ? `${Math.round((c.completions / c.totalEnrolled) * 100)}%` : "—",
          ]),
          theme: "striped",
          headStyles: { fillColor: [91, 33, 182] },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 8 },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }

      // ── Top Sellers ──
      if (data.topSellers.length > 0) {
        if (y > pageH - 40) { doc.addPage(); y = 18; }
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Top Sellers", 14, y); y += 6;
        autoTable(doc, {
          startY: y,
          head: [["Name", "Total Sales (SAR)"]],
          body: data.topSellers.map((s) => [s.name, s.totalSales.toLocaleString()]),
          theme: "striped",
          headStyles: { fillColor: [91, 33, 182] },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 8 },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }

      // ── Stars ──
      if (data.stars.length > 0) {
        if (y > pageH - 40) { doc.addPage(); y = 18; }
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Stars", 14, y); y += 6;
        autoTable(doc, {
          startY: y,
          head: [["Employee", "Award", "Period"]],
          body: data.stars.map((s) => [s.name, s.type === "week" ? "Star of the Week" : "Star of the Month", s.period]),
          theme: "striped",
          headStyles: { fillColor: [91, 33, 182] },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 8 },
        });
      }

      const month = new Date().toISOString().slice(0, 7);
      doc.save(`${data.company.name}-report-${month}.pdf`);
    });
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleDownload}
        disabled={isPending}
        className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/30 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        {isPending ? "Generating PDF…" : label}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
