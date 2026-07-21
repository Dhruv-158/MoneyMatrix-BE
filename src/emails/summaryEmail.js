export const buildSummaryEmail = (payload) => {
  const brandName = payload.brandName || "Expense Tracker";
  const primaryColor = payload.primaryColor || "#0f62fe";
  const subject = payload.type === "monthly" ? "Monthly Expense Summary" : "Daily Expense Summary";

  const formatMoney = (value) => {
    const num = Number(value || 0);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  };

  const cashBalance = payload.cashBalance ?? 0;
  const banks = Array.isArray(payload.banks) ? payload.banks : payload.bankBalances || [];
  const categoryWise = payload.categoryWiseExpenses || [];
  const bankWise = payload.bankWiseExpenses || [];

  const text = [
    `${subject}`,
    `Income: ${formatMoney(payload.income)}`,
    `Expense: ${formatMoney(payload.expense)}`,
    `Net: ${formatMoney(payload.net)}`,
    `Cash Balance: ${formatMoney(cashBalance)}`
  ].join("\n");

  const banksRows = banks
    .map((bank) => `<tr><td>${bank.bankName || "Bank"}</td><td style="text-align:right;">${formatMoney(bank.currentBalance)}</td></tr>`)
    .join("");

  const categoryRows = categoryWise
    .slice(0, 8)
    .map((item) => `<tr><td>${item.category || "Uncategorized"}</td><td style="text-align:right;">${formatMoney(item.total)}</td></tr>`)
    .join("");

  const bankWiseRows = bankWise
    .slice(0, 8)
    .map((item) => `<tr><td>${item.bankName || "Bank"}</td><td style="text-align:right;">${formatMoney(item.total)}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; background:#f6f7fb; padding: 24px;">
      <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08);">
        <div style="background: ${primaryColor}; color: #ffffff; padding: 20px 28px;">
          <div style="font-size: 18px; letter-spacing: 0.5px;">${brandName}</div>
          <div style="font-size: 22px; font-weight: 700; margin-top: 6px;">${subject}</div>
        </div>

        <div style="padding: 24px 28px;">
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <div style="flex: 1 1 180px; background: #f3f6ff; padding: 14px 16px; border-radius: 10px;">
              <div style="font-size: 12px; color: #4c566a;">Total Income</div>
              <div style="font-size: 20px; font-weight: 700; color: #1f2937;">${formatMoney(payload.income)}</div>
            </div>
            <div style="flex: 1 1 180px; background: #fff3f1; padding: 14px 16px; border-radius: 10px;">
              <div style="font-size: 12px; color: #4c566a;">Total Expense</div>
              <div style="font-size: 20px; font-weight: 700; color: #1f2937;">${formatMoney(payload.expense)}</div>
            </div>
            <div style="flex: 1 1 180px; background: #f0fff4; padding: 14px 16px; border-radius: 10px;">
              <div style="font-size: 12px; color: #4c566a;">Net Savings</div>
              <div style="font-size: 20px; font-weight: 700; color: #1f2937;">${formatMoney(payload.net)}</div>
            </div>
          </div>

          <div style="margin-top: 22px;">
            <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">Balances</div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
              <div style="background: #f8fafc; padding: 12px 14px; border-radius: 8px;">
                <div style="font-size: 12px; color: #6b7280;">Cash Balance</div>
                <div style="font-size: 16px; font-weight: 700;">${formatMoney(cashBalance)}</div>
              </div>
            </div>
          </div>

          <div style="margin-top: 18px;">
            <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">Bank Balances</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #f3f4f6; text-align: left;">
                  <th style="padding: 8px;">Bank</th>
                  <th style="padding: 8px; text-align:right;">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${banksRows || `<tr><td style="padding: 8px;" colspan="2">No banks yet</td></tr>`}
              </tbody>
            </table>
          </div>

          <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 18px;">
            <div style="flex: 1 1 300px;">
              <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">Category Expenses</div>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: #f3f4f6; text-align: left;">
                    <th style="padding: 8px;">Category</th>
                    <th style="padding: 8px; text-align:right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${categoryRows || `<tr><td style="padding: 8px;" colspan="2">No category data</td></tr>`}
                </tbody>
              </table>
            </div>

            <div style="flex: 1 1 300px;">
              <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">Bank Expenses</div>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: #f3f4f6; text-align: left;">
                    <th style="padding: 8px;">Bank</th>
                    <th style="padding: 8px; text-align:right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${bankWiseRows || `<tr><td style="padding: 8px;" colspan="2">No bank data</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 16px 28px; color: #6b7280; font-size: 12px;">
          This email was generated automatically by ${brandName}.
        </div>
      </div>
    </div>
  `;

  return { subject, text, html };
};
