export const calculateNextDueDate = (currentDate, frequency) => {
  const date = new Date(currentDate);
  if (Number.isNaN(date.getTime())) return null;

  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (frequency === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  }

  return date;
};
