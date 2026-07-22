import { asyncHandler } from "../utils/asyncHandler.js";
import { getMonthlyReport } from "./report.controller.js";
import { buildPdfReport } from "../reports/pdfReport.js";

export const downloadMonthlyReportPdf = asyncHandler(async (req, res) => {
  const reportData = {};
  const fakeRes = {
    status: () => fakeRes,
    json: (payload) => {
      Object.assign(reportData, payload.data || {});
    }
  };

  await getMonthlyReport({ ...req, query: req.query }, fakeRes);

  const type = req.query.type || "Monthly";
  const dateParam = req.query.date || "";

  const pdfBuffer = await buildPdfReport(reportData, type, dateParam);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=report-${type}-${dateParam}.pdf`);
  res.setHeader("Content-Length", pdfBuffer.length);

  res.end(pdfBuffer);
});
