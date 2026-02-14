import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { JobCard } from "@/types";

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
  async exportJobHistoryToPDF(jobs: JobCard[], title: string = "Job History Report") {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Report Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("JOSM ELECTRICAL PVT LTD", pageWidth / 2, yPosition, { align: "center" });
    
    yPosition += 8;
    doc.setFontSize(14);
    doc.text(title, pageWidth / 2, yPosition, { align: "center" });
    
    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, {
      align: "center",
    });
    
    yPosition += 10;
    doc.setLineWidth(0.5);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
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