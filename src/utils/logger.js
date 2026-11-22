const write = (level, payload) => {
  const line = {
    time: new Date().toISOString(),
    level,
    service: "moneymatrix-be",
    ...payload
  };
  const text = JSON.stringify(line);
  if (level === "error") {
    console.error(text);
  } else if (level === "warn") {
    console.warn(text);
  } else {
    console.log(text);
  }
};

export const logger = {
  info: (msg, extra = {}) => write("info", { msg, ...extra }),
  warn: (msg, extra = {}) => write("warn", { msg, ...extra }),
  error: (msg, extra = {}) => write("error", { msg, ...extra })
};
