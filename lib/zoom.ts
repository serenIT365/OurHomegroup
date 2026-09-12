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
