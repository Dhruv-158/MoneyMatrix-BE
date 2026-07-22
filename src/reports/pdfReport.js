import puppeteer from "puppeteer";

export const buildPdfReport = async (report, type = "Monthly", dateParam = "") => {
  console.log("+++++++++++++++++++++++++++++++++++++++++++++++++HEllo")
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const summary = report.summary || { income: 0, expense: 0, transfer: 0 };
  const netSavings = report.netSavings || 0;
  const cashBalance = report.cashBalance || 0;
  const cashWithdrawals = report.cashWithdrawals || 0;
  const cashExpenses = report.cashExpenses || 0;
  const transfers = report.transfers || 0;
  const bankBalances = report.bankBalances || [];
  const bankWiseExpenses = report.bankWiseExpenses || [];
  const transactionCount = report.transactionCount || [];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>MoneyMatrix Financial Report</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif;
        }
        body {
          background-color: #0f172a;
          color: #f8fafc;
          padding: 32px;
          -webkit-print-color-adjust: exact;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #1e293b;
          padding-bottom: 20px;
          margin-bottom: 28px;
        }
        .brand {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .report-tag {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .meta-info {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 4px;
        }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 14px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 16px;
        }
        .stat-label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
          margin-bottom: 6px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 700;
        }
        .income { color: #10b981; }
        .expense { color: #ef4444; }
        .transfers { color: #3b82f6; }
        .savings { color: #f59e0b; }

        .overview-box {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(30, 41, 59, 0.5) 100%);
          border: 1px solid rgba(6, 182, 212, 0.25);
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .overview-title {
          font-size: 13px;
          color: #06b6d4;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .overview-val {
          font-size: 26px;
          font-weight: 800;
          color: #22d3ee;
          margin-bottom: 16px;
        }
        .overview-subgrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 14px;
        }
        .sub-item label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
          display: block;
        }
        .sub-item span {
          font-size: 14px;
          font-weight: 700;
          margin-top: 2px;
          display: block;
        }

        .table-card {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 24px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        th {
          text-align: left;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          padding: 8px 12px;
          border-bottom: 1px solid #334155;
        }
        td {
          font-size: 13px;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: #e2e8f0;
        }
        tr:last-child td {
          border-bottom: none;
        }

        .footer {
          margin-top: 32px;
          border-top: 1px solid #1e293b;
          padding-top: 14px;
          text-align: center;
          font-size: 11px;
          color: #64748b;
        }
      </style>
    </head>
    <body>

      <!-- Header -->
      <div class="header">
        <div>
          <div class="brand">MoneyMatrix</div>
          <div class="meta-info">Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</div>
        </div>
        <div class="report-tag">${type} Financial Statement (${dateParam || 'Current'})</div>
      </div>

      <!-- Key Summary Stats -->
      <div class="section-title">Summary Statistics</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Income</div>
          <div class="stat-value income">+${formatCurrency(summary.income)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Expense</div>
          <div class="stat-value expense">-${formatCurrency(summary.expense)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Transfers</div>
          <div class="stat-value transfers">${formatCurrency(summary.transfer)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Net Savings</div>
          <div class="stat-value savings">${formatCurrency(netSavings)}</div>
        </div>
      </div>

      <!-- Cash Wallet Overview -->
      <div class="overview-box">
        <div class="overview-title">💵 Cash Wallet Overview</div>
        <div class="overview-val">${formatCurrency(cashBalance)}</div>
        <div class="overview-subgrid">
          <div class="sub-item">
            <label>Cash Inflow (From Bank)</label>
            <span class="income">+${formatCurrency(cashWithdrawals)}</span>
          </div>
          <div class="sub-item">
            <label>Cash Outflow (Expenses)</label>
            <span class="expense">-${formatCurrency(cashExpenses)}</span>
          </div>
          <div class="sub-item">
            <label>Total Transfers Activity</label>
            <span class="transfers">${formatCurrency(transfers)}</span>
          </div>
        </div>
      </div>

      <!-- Bank Accounts Breakdown -->
      ${
        bankBalances.length > 0
          ? `
      <div class="table-card">
        <div class="section-title" style="margin-bottom: 8px;">🏦 Bank Balances</div>
        <table>
          <thead>
            <tr>
              <th>Bank Name</th>
              <th>Account Type</th>
              <th style="text-align: right;">Current Balance</th>
            </tr>
          </thead>
          <tbody>
            ${bankBalances
              .map(
                (b) => `
              <tr>
                <td style="font-weight: 600;">${b.bankName || 'Bank'}</td>
                <td style="color: #94a3b8; text-transform: capitalize;">${b.accountType || 'Savings'}</td>
                <td style="text-align: right; font-weight: 700; color: #60a5fa;">${formatCurrency(b.currentBalance)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <!-- Bank-wise Expenses Breakdown -->
      ${
        bankWiseExpenses.length > 0
          ? `
      <div class="table-card">
        <div class="section-title" style="margin-bottom: 8px;">📊 Bank-wise Expenses Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Bank Name</th>
              <th style="text-align: right;">Total Expense</th>
            </tr>
          </thead>
          <tbody>
            ${bankWiseExpenses
              .map(
                (item) => `
              <tr>
                <td style="font-weight: 600;">${item.bankName || 'Bank'}</td>
                <td style="text-align: right; font-weight: 700; color: #ef4444;">${formatCurrency(item.total)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <!-- Transaction Counts -->
      ${
        transactionCount.length > 0
          ? `
      <div class="table-card">
        <div class="section-title" style="margin-bottom: 8px;">📈 Activity Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Transaction Type</th>
              <th style="text-align: right;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${transactionCount
              .map(
                (t) => `
              <tr>
                <td style="text-transform: capitalize; font-weight: 600;">${t._id}</td>
                <td style="text-align: right; font-weight: 700;">${t.count}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <div class="footer">
        MoneyMatrix Financial Analytics • Confidential Statement • Page 1 of 1
      </div>

    </body>
    </html>
  `;

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
  });

  await browser.close();
  return pdfBuffer;
};

