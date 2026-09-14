export interface ZoomMeetingLink {
  joinUrl: string;
  meetingId?: string;
  password?: string;
}

export function createZoomFallbackLink(meetingName: string): ZoomMeetingLink {
  const slug = meetingName.toLowerCase().replace(/\s+/g, "-").slice(0, 30);
  return {
    joinUrl: `https://zoom.us/j/placeholder-${slug}`,
    meetingId: "00000000000",
  };
}

/** Parse meeting number + password from a zoom.us join URL */
export function parseZoomJoinUrl(url?: string | null): {
  meetingNumber: string;
  password: string;
} {
  if (!url) return { meetingNumber: "", password: "" };
  try {
    const u = new URL(url);
    const pwd = u.searchParams.get("pwd") || "";
    const parts = u.pathname.split("/").filter(Boolean);
    const jIndex = parts.findIndex((p) => p === "j" || p === "wc");
    const raw = jIndex >= 0 ? parts[jIndex + 1] || "" : parts[parts.length - 1] || "";
    const meetingNumber = raw.replace(/\D/g, "");
    return { meetingNumber, password: pwd };
  } catch {
    const meetingNumber = url.replace(/\D/g, "");
    return { meetingNumber, password: "" };
  }
}
