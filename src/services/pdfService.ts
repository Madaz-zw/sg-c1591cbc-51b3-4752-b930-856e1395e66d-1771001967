import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { JobCard } from "@/types";

// Company logo as base64 (SVG converted to data URL)
const COMPANY_LOGO_DATA = `data:image/svg+xml;base64,${btoa(`<svg width="200" height="80" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="80" rx="4" fill="#1e40af"/>
  <path d="M50 20L35 45H45L40 60L55 35H45L50 20Z" fill="#fbbf24" stroke="#fff" stroke-width="2"/>
  <text x="75" y="35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">JOSM ELECTRICAL</text>
  <text x="75" y="55" font-family="Arial, sans-serif" font-size="12" fill="#93c5fd">Manufacturing Excellence</text>
  <line x1="70" y1="42" x2="190" y2="42" stroke="#3b82f6" stroke-width="1"/>
  <circle cx="72" cy="42" r="2" fill="#60a5fa"/>
  <circle cx="188" cy="42" r="2" fill="#60a5fa"/>
</svg>`)}`;

/**
 * Add company logo and header to PDF
 */
const addLogoAndHeader = (
  doc: jsPDF,
  title: string,
  subtitle?: string
): number => {
  try {
    // Add logo (top-left)
    doc.addImage(COMPANY_LOGO_DATA, "SVG", 15, 10, 50, 20);
  } catch (error) {
    console.warn("Failed to add logo image:", error);
    // Fallback: just add text header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("JOSM ELECTRICAL", 15, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Manufacturing Excellence", 15, 27);
  }

  // Add title (top-right)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175); // Blue color
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, 210 - titleWidth - 15, 20);

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, 210 - subtitleWidth - 15, 27);
  }

  // Add horizontal line separator
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.5);
  doc.line(15, 35, 195, 35);

  // Reset text color for body content
  doc.setTextColor(0, 0, 0);

  return 40; // Return Y position after header
};

interface PDFExportOptions {
  includePhotos?: boolean;
  includeSignatureLines?: boolean;
}

export const pdfService = {
  // Export single job card to PDF
  async exportJobToPDF(job: JobCard, options: PDFExportOptions = {}) {
    const { includePhotos = true, includeSignatureLines = true } = options;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Company Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("JOSM ELECTRICAL PVT LTD", pageWidth / 2, yPosition, { align: "center" });
    
    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Manufacturing Job Card", pageWidth / 2, yPosition, { align: "center" });
    
    yPosition += 10;
    doc.setLineWidth(0.5);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 10;

    // Job Card Number (Large, centered)
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Job Card #${job.jobCardNumber}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 12;

    // Job Details Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Job Details", 15, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const detailsData = [
      ["Job Name:", job.jobName],
      ["Client:", job.clientName],
      ["Board Type:", job.boardType],
      ["Board Color:", job.boardColor],
      ["Priority:", job.priority],
      ["Recipient:", job.recipientName],
      ["Supervisor:", job.supervisorName || "Not assigned"],
      ["Created By:", job.createdBy],
      ["Date Created:", new Date(job.createdAt).toLocaleString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: detailsData,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        1: { cellWidth: "auto" },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Workflow Status Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Workflow Status", 15, yPosition);
    yPosition += 8;

    const workflowData = [
      [
        "Fabrication",
        job.fabricationStatus || "Pending",
        job.fabricationByName || "-",
        job.fabricationCompletedAt
          ? new Date(job.fabricationCompletedAt).toLocaleString()
          : "-",
      ],
      [
        "Assembling",
        job.assemblingStatus || "Pending",
        job.assemblingByName || "-",
        job.assemblingCompletedAt
          ? new Date(job.assemblingCompletedAt).toLocaleString()
          : "-",
      ],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [["Stage", "Status", "Worker", "Completed"]],
      body: workflowData,
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Materials Used Section
    if (job.materialsUsed && job.materialsUsed.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Materials Used", 15, yPosition);
      yPosition += 8;

      const materialsData = job.materialsUsed.map((material) => [
        material.materialName,
        material.quantity.toString(),
        material.process || "General",
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Material", "Quantity", "Process"]],
        body: materialsData,
        theme: "striped",
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [92, 184, 92], textColor: 255 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Notes Section
    if (job.notes) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Notes", 15, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(job.notes, pageWidth - 30);
      doc.text(splitNotes, 15, yPosition);
      yPosition += splitNotes.length * 5 + 10;
    }

    // Photos Section
    if (includePhotos && job.photoUrls && job.photoUrls.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Photos", 15, yPosition);
      yPosition += 8;

      // Load and add photos
      for (let i = 0; i < job.photoUrls.length; i++) {
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }

        try {
          // Add photo placeholder text (actual image loading would require CORS-enabled URLs)
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.text(`Photo ${i + 1}: ${job.photoUrls[i]}`, 15, yPosition);
          yPosition += 6;
        } catch (error) {
          console.error("Error adding photo:", error);
        }
      }
      yPosition += 10;
    }

    // Signature Lines
    if (includeSignatureLines) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      yPosition = pageHeight - 35;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const signatureWidth = 60;
      const leftMargin = 20;
      const rightMargin = pageWidth - 80;

      // Supervisor signature
      doc.line(leftMargin, yPosition, leftMargin + signatureWidth, yPosition);
      doc.text("Supervisor Signature", leftMargin, yPosition + 6);

      // Worker signature
      doc.line(rightMargin, yPosition, rightMargin + signatureWidth, yPosition);
      doc.text("Worker Signature", rightMargin, yPosition + 6);
    }

    // Save PDF
    doc.save(`JobCard_${job.jobCardNumber}_${Date.now()}.pdf`);
  },

  // Export multiple jobs to PDF
  async exportJobHistoryToPDF(jobs: JobCard[], filterInfo?: string) {
    const doc = new jsPDF();

    // Add logo and header
    let yPosition = addLogoAndHeader(
      doc,
      "Job History Report",
      `Generated: ${new Date().toLocaleString()}`
    );

    yPosition += 5;

    // Filter information (if provided)
    if (filterInfo) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(filterInfo, 15, yPosition);
      yPosition += 8;
    }

    doc.setLineWidth(0.5);
    doc.line(15, yPosition, doc.internal.pageSize.width - 15, yPosition);
    yPosition += 10;

    // Summary Statistics
    const completedJobs = jobs.filter((j) => j.status === "completed").length;
    const assemblingJobs = jobs.filter((j) => j.status === "assembling").length;
    const fabricationJobs = jobs.filter((j) => j.status === "fabrication").length;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 15, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Jobs: ${jobs.length}`, 15, yPosition);
    doc.text(`Completed: ${completedJobs}`, 60, yPosition);
    doc.text(`Assembling: ${assemblingJobs}`, 105, yPosition);
    doc.text(`Fabrication: ${fabricationJobs}`, 150, yPosition);
    yPosition += 12;

    // Jobs Table
    const tableData = jobs.map((job) => [
      job.jobCardNumber,
      job.jobName,
      job.clientName,
      job.boardType,
      job.status,
      job.priority,
      new Date(job.createdAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Job #", "Job Name", "Client", "Board", "Status", "Priority", "Date"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 22 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 },
      },
    });

    // Save PDF
    doc.save(`JobHistory_${Date.now()}.pdf`);
  },

  // Export filtered jobs with detailed breakdown
  async exportDetailedJobReport(jobs: JobCard[], filters?: {
    dateRange?: { from: Date; to: Date };
    status?: string;
    priority?: string;
  }) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Report Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("JOSM ELECTRICAL PVT LTD", pageWidth / 2, yPosition, { align: "center" });
    
    yPosition += 8;
    doc.setFontSize(14);
    doc.text("Detailed Job Report", pageWidth / 2, yPosition, { align: "center" });
    
    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;

    // Filters Applied
    if (filters) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      let filterText = "Filters: ";
      if (filters.dateRange) {
        filterText += `Date: ${filters.dateRange.from.toLocaleDateString()} - ${filters.dateRange.to.toLocaleDateString()} `;
      }
      if (filters.status) filterText += `Status: ${filters.status} `;
      if (filters.priority) filterText += `Priority: ${filters.priority}`;
      doc.text(filterText, 15, yPosition);
      yPosition += 8;
    }

    doc.setLineWidth(0.5);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 10;

    // Detailed job breakdown
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      // Job Header
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. Job #${job.jobCardNumber} - ${job.jobName}`, 15, yPosition);
      yPosition += 8;

      // Job Details (compact)
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Client: ${job.clientName} | Board: ${job.boardType} (${job.boardColor})`, 15, yPosition);
      yPosition += 5;
      doc.text(
        `Status: ${job.status} | Priority: ${job.priority} | Created: ${new Date(job.createdAt).toLocaleDateString()}`,
        15,
        yPosition
      );
      yPosition += 5;

      // Materials summary
      if (job.materialsUsed && job.materialsUsed.length > 0) {
        doc.text(`Materials: ${job.materialsUsed.length} items used`, 15, yPosition);
        yPosition += 5;
      }

      // Workflow status
      doc.text(
        `Fabrication: ${job.fabricationStatus || "Pending"} | Assembling: ${job.assemblingStatus || "Pending"}`,
        15,
        yPosition
      );
      yPosition += 10;

      // Separator line
      doc.setLineWidth(0.2);
      doc.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;
    }

    // Save PDF
    doc.save(`DetailedJobReport_${Date.now()}.pdf`);
  },
};