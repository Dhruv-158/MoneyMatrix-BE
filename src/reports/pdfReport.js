import puppeteer from "puppeteer";

export const buildPdfReport = async (report, type = "Monthly", dateParam = "") => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const summary = report.summary || { income: 0, expense: 0, transfer: 0 };
  const netSavings = report.netSavings || 0;
  const cashBalance = report.cashBalance || 0;
  const bankBalances = report.bankBalances || [];
  const totalBankBalance = bankBalances.reduce((sum, b) => sum + (b.currentBalance || 0), 0);
  const totalBalance = netSavings > 0 ? netSavings : (cashBalance + totalBankBalance);
  const bankWiseExpenses = report.bankWiseExpenses || [];
  const dailyBreakdown = report.dailyBreakdown || [];
  const transactionCount = report.transactionCount || [];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const monthYearHeader = dateParam ? dateParam : new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Map transaction counts
  const txMap = { income: 0, expense: 0, transfer: 0 };
  transactionCount.forEach((t) => {
    if (t._id) txMap[t._id] = t.count;
  });

  // ── SVG Chart Generator: Horizontal Bank-wise Breakdown ──
  const generateBankWiseSvg = (data) => {
    if (!data || data.length === 0) {
      return `<p style="color: #64748b; font-size: 12px; font-style: italic; text-align: center; padding: 16px;">No bank expense data recorded for this period.</p>`;
    }
    const maxVal = Math.max(...data.map((d) => d.total || 0), 1);
    const barHeight = 22;
    const gap = 16;
    const svgHeight = data.length * (barHeight + gap) + 10;

    const barsHtml = data
      .map((item, index) => {
        const y = index * (barHeight + gap) + 5;
        const widthPct = Math.max(5, Math.min(75, ((item.total || 0) / maxVal) * 70));
        const valText = formatCurrency(item.total);
        return `
          <text x="0" y="${y + 16}" font-size="12" font-weight="600" fill="#1e293b">${item.bankName || 'Bank'}</text>
          <rect x="140" y="${y}" width="${widthPct}%" height="${barHeight}" rx="4" fill="#2563eb" />
          <text x="calc(145px + ${widthPct}%)" y="${y + 15}" font-size="11" font-weight="700" fill="#0f172a">${valText}</text>
        `;
      })
      .join("");

    return `
      <svg width="100%" height="${svgHeight}" style="overflow: visible;">
        ${barsHtml}
      </svg>
    `;
  };

  // ── SVG Chart Generator: Income vs Expense Trend ──
  const generateTrendSvg = (data) => {
    if (!data || data.length === 0) {
      return `<p style="color: #64748b; font-size: 12px; font-style: italic; text-align: center; padding: 16px;">No trend data available for this period.</p>`;
    }
    const chartWidth = 650;
    const chartHeight = 160;
    const maxVal = Math.max(...data.map((d) => Math.max(d.income || 0, d.expense || 0)), 1);

    const step = chartWidth / Math.max(data.length - 1, 1);

    const incomePoints = data.map((d, i) => `${i * step},${chartHeight - ((d.income || 0) / maxVal) * (chartHeight - 30)}`).join(" ");
    const expensePoints = data.map((d, i) => `${i * step},${chartHeight - ((d.expense || 0) / maxVal) * (chartHeight - 30)}`).join(" ");

    const xLabels = data
      .filter((_, i) => i % Math.max(1, Math.floor(data.length / 8)) === 0)
      .map((d, i) => {
        const x = i * Math.max(1, Math.floor(data.length / 8)) * step;
        return `<text x="${x}" y="${chartHeight + 18}" font-size="10" fill="#64748b" text-anchor="middle">${d.date?.slice(5) || d.date}</text>`;
      })
      .join("");

    return `
      <div style="margin-bottom: 12px; display: flex; justify-content: flex-end; gap: 16px; font-size: 11px; font-weight: 600;">
        <span style="display: flex; items-center; gap: 6px;"><span style="display: inline-block; width: 12px; height: 12px; background: #059669; border-radius: 2px;"></span> Income</span>
        <span style="display: flex; items-center; gap: 6px;"><span style="display: inline-block; width: 12px; height: 12px; background: #dc2626; border-radius: 2px;"></span> Expense</span>
      </div>
      <svg width="100%" height="${chartHeight + 30}" viewBox="0 0 ${chartWidth} ${chartHeight + 30}" preserveAspectRatio="none" style="overflow: visible;">
        <!-- Grid lines -->
        <line x1="0" y1="0" x2="${chartWidth}" y2="0" stroke="#e2e8f0" stroke-dasharray="3 3" />
        <line x1="0" y1="${chartHeight / 2}" x2="${chartWidth}" y2="${chartHeight / 2}" stroke="#e2e8f0" stroke-dasharray="3 3" />
        <line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="#cbd5e1" />
        
        <!-- Lines -->
        <polyline fill="none" stroke="#059669" stroke-width="2.5" points="${incomePoints}" />
        <polyline fill="none" stroke="#dc2626" stroke-width="2.5" points="${expensePoints}" />
        
        <!-- X Axis Labels -->
        ${xLabels}
      </svg>
    `;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Monthly Financial Report — ${monthYearHeader}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        body {
          background-color: #ffffff;
          color: #0f172a;
          font-size: 12px;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
        }

        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
        .header-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .header-meta {
          font-size: 11px;
          color: #64748b;
          text-align: right;
        }

        .section {
          margin-bottom: 24px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          padding-bottom: 4px;
          border-bottom: 1px solid #e2e8f0;
        }

        /* 2. Summary Row - 4 Compact Stat Cards */
        .summary-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
          page-break-inside: avoid;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
        }
        .stat-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 16px;
          font-weight: 800;
        }
        .val-income { color: #059669; }
        .val-expense { color: #dc2626; }
        .val-transfer { color: #2563eb; }
        .val-savings { color: #d97706; }

        /* Tables Styling */
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          font-size: 12px;
        }
        .report-table th {
          background-color: #f1f5f9;
          color: #475569;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 8px 12px;
          border-top: 1px solid #cbd5e1;
          border-bottom: 2px solid #cbd5e1;
          text-align: left;
        }
        .report-table td {
          padding: 9px 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b;
        }
        .report-table tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .text-right {
          text-align: right !important;
        }
        .text-center {
          text-align: center !important;
        }
        .font-bold {
          font-weight: 700;
        }

        .chart-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }

        .footer {
          margin-top: 30px;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>

      <!-- Header / Page Title -->
      <div class="header-bar">
        <div>
          <h1 class="header-title">Monthly Financial Report — ${monthYearHeader}</h1>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">MoneyMatrix Personal Finance Analytics</div>
        </div>
        <div class="header-meta">
          <div>Date Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div>Statement Period: ${dateParam || 'Current Month'}</div>
        </div>
      </div>

      <!-- 2. Summary Row -->
      <div class="section">
        <div class="summary-row">
          <div class="stat-card">
            <div class="stat-label">Total Income</div>
            <div class="stat-value val-income">+${formatCurrency(summary.income)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Expense</div>
            <div class="stat-value val-expense">-${formatCurrency(summary.expense)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Transfers</div>
            <div class="stat-value val-transfer">${formatCurrency(summary.transfer)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Net Savings</div>
            <div class="stat-value val-savings">${formatCurrency(netSavings)}</div>
          </div>
        </div>
      </div>

      <!-- 3. Balance Overview Table -->
      <div class="section">
        <div class="section-title">Balance Overview</div>
        <table class="report-table">
          <thead>
            <tr>
              <th>Account Category</th>
              <th>Description</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-bold">Total Net Balance</td>
              <td style="color: #64748b;">Combined Savings & Assets</td>
              <td class="text-right font-bold" style="color: #2563eb;">${formatCurrency(totalBalance)}</td>
            </tr>
            <tr>
              <td class="font-bold">Cash Balance</td>
              <td style="color: #64748b;">Physical Wallet Balance</td>
              <td class="text-right font-bold" style="color: #059669;">${formatCurrency(cashBalance)}</td>
            </tr>
            <tr>
              <td class="font-bold">Bank Balance</td>
              <td style="color: #64748b;">Cumulative Bank Accounts</td>
              <td class="text-right font-bold" style="color: #d97706;">${formatCurrency(totalBankBalance)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 4. Bank-wise Breakdown (Horizontal Bar Chart) -->
      <div class="section">
        <div class="section-title">Bank-wise Expenses Breakdown</div>
        <div class="chart-box">
          ${generateBankWiseSvg(bankWiseExpenses)}
        </div>
      </div>

      <!-- 5. Income vs Expense Trend Chart -->
      <div class="section">
        <div class="section-title">Income vs Expense Trend</div>
        <div class="chart-box">
          ${generateTrendSvg(dailyBreakdown)}
        </div>
      </div>

      <!-- 6. Bank Balances Table -->
      <div class="section">
        <div class="section-title">Bank Accounts Ledger</div>
        <table class="report-table">
          <thead>
            <tr>
              <th>Bank Name</th>
              <th>Account Type</th>
              <th class="text-right">Current Balance</th>
            </tr>
          </thead>
          <tbody>
            ${
              bankBalances.length > 0
                ? bankBalances
                    .map(
                      (b) => `
                    <tr>
                      <td class="font-bold">${b.bankName || 'Bank'}</td>
                      <td style="text-transform: capitalize; color: #64748b;">${b.accountType || 'Savings'}</td>
                      <td class="text-right font-bold" style="color: #2563eb;">${formatCurrency(b.currentBalance)}</td>
                    </tr>
                  `
                    )
                    .join('')
                : `<tr><td colspan="3" class="text-center" style="color: #64748b; padding: 12px;">No bank accounts added</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <!-- 7. Transaction Counts Table -->
      <div class="section">
        <div class="section-title">Transaction Activity Summary</div>
        <table class="report-table">
          <thead>
            <tr>
              <th class="text-center">Income Count</th>
              <th class="text-center">Expense Count</th>
              <th class="text-center">Transfer Count</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center font-bold" style="color: #059669;">${txMap.income || 0}</td>
              <td class="text-center font-bold" style="color: #dc2626;">${txMap.expense || 0}</td>
              <td class="text-center font-bold" style="color: #2563eb;">${txMap.transfer || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div>MoneyMatrix Personal Finance • Official Monthly Statement</div>
        <div>Confidential & Privileged</div>
      </div>

    </body>
    </html>
  `;

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
  });

  await browser.close();
  return pdfBuffer;
};


