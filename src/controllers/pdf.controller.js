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

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=monthly-report.pdf");

  const stream = buildPdfReport(reportData);
  stream.pipe(res);
});
