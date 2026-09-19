export function formatDateString(dateString) {
  if (!dateString) return "N/A";

  const rawStr = String(dateString).trim().replace(" ", "T");
  const normalizedStr =
    !rawStr.endsWith("Z") && !rawStr.includes("+") ? `${rawStr}Z` : rawStr;
  const parsedDate = new Date(normalizedStr);

  if (isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return `${parsedDate.toLocaleDateString()} ${parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
