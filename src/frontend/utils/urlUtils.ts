export const shortenUrl = (url: string, maxLength: number = 50) => {
  // Remove the protocol (http:// or https://)
  let displayUrl = url.replace(/^https?:\/\//, "");

  if (displayUrl.length <= maxLength) return displayUrl;

  // Calculate lengths
  const ellipsis = "...";
  const frontLength = Math.ceil((maxLength - ellipsis.length) / 2);
  const backLength = Math.floor((maxLength - ellipsis.length) / 2);

  // Truncate the middle
  return (
    displayUrl.substring(0, frontLength) +
    ellipsis +
    displayUrl.substring(displayUrl.length - backLength)
  );
};