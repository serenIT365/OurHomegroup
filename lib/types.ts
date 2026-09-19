export type Role = "visitor" | "member" | "moderator" | "admin" | "poweruser" | "superadmin";

export type MeetingProvider = "livekit" | "zoom" | "hybrid";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  mission?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string; // matches Clerk userId
  email: string;
  name: string;
  nickname?: string;
  role: Role;
  organizationId?: string;
  pronouns?: string;
  recoveryAnniversary?: string;
  timezone?: string;
  avatarUrl?: string;
  enabled?: boolean;
  privacy: {
    hideLastName: boolean;
    hideEmail: boolean;
    hideAttendance: boolean;
    anonymousDisplay: boolean;
  };
}

export interface Meeting {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type?: string; // e.g. "Women's Recovery", "Veterans"
  hostId?: string;
  chairId?: string;
  coHostIds?: string[];
  provider: MeetingProvider;
  livekitRoomName: string;
  zoomJoinUrl?: string;
  capacity: number;
  waitingRoomEnabled: boolean;
  password?: string;
  recordingEnabled: boolean;
  visibility: "public" | "private" | "invite";
  timezone: string;
  language: string;
  // Schedule
  startAt: string; // ISO
  endAt?: string;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  recurrenceRule?: string; // BYDAY=SU,MO,TU,WE,TH,FR,SA or 0,1,2,3,4,5,6
  enabled?: boolean;
  status?: "pending" | "approved" | "declined";
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  meetingId: string;
  organizationId: string;
  userId: string;
  displayName: string;
  joinedAt: string;
  leftAt?: string;
  durationSeconds?: number;
  device?: string;
  role: Role;
}

export interface MeetingOccurrence {
  id: string;
  meetingId: string;
  organizationId: string;
  startAt: string;
  chairId?: string;
  createdAt: string;
}
