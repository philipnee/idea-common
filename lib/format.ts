export function formatRelativeTime(timestamp: string) {
  const deltaMs = Date.now() - Date.parse(timestamp);
  const deltaMinutes = Math.max(Math.floor(deltaMs / 60_000), 0);

  if (deltaMinutes < 1) {
    return "just now";
  }

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);

  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
}

export function extractIdeaExcerpt(details: string | null, maxLength = 160) {
  if (!details) {
    return null;
  }

  const firstBlock = details
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .find(Boolean);

  if (!firstBlock) {
    return null;
  }

  if (firstBlock.length <= maxLength) {
    return firstBlock;
  }

  return `${firstBlock.slice(0, maxLength - 1).trimEnd()}...`;
}

export function splitIdeaDetails(details: string | null) {
  if (!details) {
    return [];
  }

  return details
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function formatExternalLinkLabel(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path =
      parsed.pathname && parsed.pathname !== "/"
        ? parsed.pathname.replace(/\/$/, "")
        : "";
    const label = `${host}${path}`;

    if (label.length <= 40) {
      return label;
    }

    return `${label.slice(0, 37)}...`;
  } catch {
    return "Open source link";
  }
}

export function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
