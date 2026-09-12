/**
 * Lightweight in-memory store for MVP.
 * Replace with Prisma + Postgres / Supabase for production.
 */
import { v4 as uuid } from "uuid";
import type { Organization, Meeting, AttendanceRecord, UserProfile, Role } from "./types";

const orgs: Organization[] = [
  {
    id: "org_demo",
    name: "Demo Recovery Collective",
    slug: "demo",
    mission: "Safe peer support for recovery journeys.",
    createdAt: new Date().toISOString(),
  },
];

const meetings: Meeting[] = [
  {
    id: "mtg_womens",
    organizationId: "org_demo",
    name: "Women's Recovery",
    description: "Closed women's peer support meeting.",
    type: "Women's Recovery",
    provider: "hybrid",
    livekitRoomName: "ohg-demo-womens",
    capacity: 40,
    waitingRoomEnabled: true,
    recordingEnabled: false,
    visibility: "private",
    timezone: "America/New_York",
    language: "en",
    startAt: new Date(Date.now() + 3600_000).toISOString(),
    recurrence: "weekly",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mtg_veterans",
    organizationId: "org_demo",
    name: "Veterans Support",
    description: "Open discussion for veterans in recovery.",
    type: "Veterans",
    provider: "livekit",
    livekitRoomName: "ohg-demo-veterans",
    capacity: 50,
    waitingRoomEnabled: true,
    recordingEnabled: false,
    visibility: "public",
    timezone: "America/New_York",
    language: "en",
    startAt: new Date(Date.now() + 7200_000).toISOString(),
    recurrence: "weekly",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const members: UserProfile[] = [
  {
    id: "user_alex",
    email: "alex@example.com",
    name: "Alex Rivera",
    nickname: "Alex",
    role: "member",
    organizationId: "org_demo",
    pronouns: "they/them",
    timezone: "America/New_York",
    privacy: {
      hideLastName: false,
      hideEmail: true,
      hideAttendance: false,
      anonymousDisplay: false,
    },
  },
  {
    id: "user_jordan",
    email: "jordan@example.com",
    name: "Jordan Lee",
    nickname: "Jordan",
    role: "moderator",
    organizationId: "org_demo",
    pronouns: "she/her",
    recoveryAnniversary: "2024-03-15",
    timezone: "America/New_York",
    privacy: {
      hideLastName: true,
      hideEmail: true,
      hideAttendance: false,
      anonymousDisplay: false,
    },
  },
  {
    id: "user_sam",
    email: "sam@example.com",
    name: "Sam Okonkwo",
    nickname: "Sam",
    role: "admin",
    organizationId: "org_demo",
    timezone: "America/Chicago",
    privacy: {
      hideLastName: false,
      hideEmail: true,
      hideAttendance: true,
      anonymousDisplay: false,
    },
  },
  {
    id: "user_taylor",
    email: "taylor@example.com",
    name: "Taylor Kim",
    nickname: "T",
    role: "member",
    organizationId: "org_demo",
    pronouns: "he/him",
    privacy: {
      hideLastName: true,
      hideEmail: true,
      hideAttendance: true,
      anonymousDisplay: true,
    },
  },
];

const attendance: AttendanceRecord[] = [];

export const store = {
  // Organizations
  listOrgs: () => orgs,
  getOrg: (id: string) => orgs.find((o) => o.id === id),
  createOrg: (data: Omit<Organization, "id" | "createdAt">) => {
    const org: Organization = {
      ...data,
      id: `org_${uuid().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    orgs.push(org);
    return org;
  },

  // Meetings
  listMeetings: (organizationId?: string) =>
    organizationId ? meetings.filter((m) => m.organizationId === organizationId) : meetings,
  getMeeting: (id: string) => meetings.find((m) => m.id === id),
  createMeeting: (
    data: Omit<Meeting, "id" | "createdAt" | "updatedAt" | "livekitRoomName"> & {
      livekitRoomName?: string;
    }
  ) => {
    const id = `mtg_${uuid().slice(0, 8)}`;
    const meeting: Meeting = {
      ...data,
      id,
      livekitRoomName: data.livekitRoomName || `ohg-${id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    meetings.push(meeting);
    return meeting;
  },
  updateMeeting: (id: string, patch: Partial<Meeting>) => {
    const idx = meetings.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    meetings[idx] = { ...meetings[idx], ...patch, updatedAt: new Date().toISOString() };
    return meetings[idx];
  },
  deleteMeeting: (id: string) => {
    const idx = meetings.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    meetings.splice(idx, 1);
    return true;
  },

  // Members
  listMembers: (organizationId?: string) =>
    organizationId ? members.filter((m) => m.organizationId === organizationId) : members,
  getMember: (id: string) => members.find((m) => m.id === id),
  createMember: (data: Omit<UserProfile, "id"> & { id?: string }) => {
    const member: UserProfile = {
      ...data,
      id: data.id || `user_${uuid().slice(0, 8)}`,
      privacy: data.privacy || {
        hideLastName: false,
        hideEmail: true,
        hideAttendance: false,
        anonymousDisplay: false,
      },
    };
    members.push(member);
    return member;
  },
  updateMember: (id: string, patch: Partial<UserProfile>) => {
    const idx = members.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    members[idx] = { ...members[idx], ...patch };
    return members[idx];
  },

  // Attendance
  listAttendance: (meetingId?: string, organizationId?: string) => {
    let list = attendance;
    if (meetingId) list = list.filter((a) => a.meetingId === meetingId);
    if (organizationId) list = list.filter((a) => a.organizationId === organizationId);
    return list;
  },
  recordJoin: (data: Omit<AttendanceRecord, "id" | "joinedAt">) => {
    const record: AttendanceRecord = {
      ...data,
      id: `att_${uuid().slice(0, 8)}`,
      joinedAt: new Date().toISOString(),
    };
    attendance.push(record);
    return record;
  },
  recordLeave: (userId: string, meetingId: string) => {
    const rec = [...attendance]
      .reverse()
      .find((a) => a.userId === userId && a.meetingId === meetingId && !a.leftAt);
    if (!rec) return null;
    rec.leftAt = new Date().toISOString();
    rec.durationSeconds = Math.round(
      (new Date(rec.leftAt).getTime() - new Date(rec.joinedAt).getTime()) / 1000
    );
    return rec;
  },
};
