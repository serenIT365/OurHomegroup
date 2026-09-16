/**
 * Data access. Uses Supabase when env vars are set; otherwise in-memory fallback.
 */
import { v4 as uuid } from "uuid";
import type { Organization, Meeting, AttendanceRecord, UserProfile, MeetingOccurrence } from "./types";
import { getSupabase, isSupabaseConfigured } from "./supabase";

const DEFAULT_PRIVACY = {
  hideLastName: false,
  hideEmail: true,
  hideAttendance: false,
  anonymousDisplay: false,
};

function rowToMeeting(row: Record<string, unknown>): Meeting {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    name: row.name as string,
    description: (row.description as string) || undefined,
    type: (row.type as string) || undefined,
    hostId: (row.host_id as string) || (row.chair_id as string) || undefined,
    chairId: (row.chair_id as string) || (row.host_id as string) || undefined,
    provider: row.provider as Meeting["provider"],
    livekitRoomName: row.livekit_room_name as string,
    zoomJoinUrl: (row.zoom_join_url as string) || undefined,
    capacity: Number(row.capacity),
    waitingRoomEnabled: Boolean(row.waiting_room_enabled),
    password: (row.password as string) || undefined,
    recordingEnabled: Boolean(row.recording_enabled),
    visibility: row.visibility as Meeting["visibility"],
    timezone: row.timezone as string,
    language: row.language as string,
    startAt: row.start_at as string,
    endAt: (row.end_at as string) || undefined,
    recurrence: row.recurrence as Meeting["recurrence"],
    recurrenceRule: (row.recurrence_rule as string) || undefined,
    enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToMember(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    nickname: (row.nickname as string) || undefined,
    role: row.role as UserProfile["role"],
    organizationId: (row.organization_id as string) || undefined,
    pronouns: (row.pronouns as string) || undefined,
    recoveryAnniversary: (row.recovery_anniversary as string) || undefined,
    timezone: (row.timezone as string) || undefined,
    avatarUrl: (row.avatar_url as string) || undefined,
    privacy: {
      hideLastName: Boolean(row.hide_last_name),
      hideEmail: Boolean(row.hide_email),
      hideAttendance: Boolean(row.hide_attendance),
      anonymousDisplay: Boolean(row.anonymous_display),
    },
  };
}

function rowToOrg(row: Record<string, unknown>): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    logoUrl: (row.logo_url as string) || undefined,
    mission: (row.mission as string) || undefined,
    createdAt: row.created_at as string,
  };
}

function rowToAttendance(row: Record<string, unknown>): AttendanceRecord {
  return {
    id: row.id as string,
    meetingId: row.meeting_id as string,
    organizationId: row.organization_id as string,
    userId: row.user_id as string,
    displayName: row.display_name as string,
    joinedAt: row.joined_at as string,
    leftAt: (row.left_at as string) || undefined,
    durationSeconds: row.duration_seconds != null ? Number(row.duration_seconds) : undefined,
    device: (row.device as string) || undefined,
    role: row.role as AttendanceRecord["role"],
  };
}

// ---- in-memory fallback (local only, no env) ----
const memOrgs: Organization[] = [
  {
    id: "org_demo",
    name: "Demo Recovery Collective",
    slug: "demo",
    mission: "Safe peer support for recovery journeys.",
    createdAt: new Date().toISOString(),
  },
];
const memMeetings: Meeting[] = [];
const memMembers: UserProfile[] = [];
const memAttendance: AttendanceRecord[] = [];


function rowToOccurrence(row: Record<string, unknown>): MeetingOccurrence {
  return {
    id: row.id as string,
    meetingId: row.meeting_id as string,
    organizationId: row.organization_id as string,
    startAt: row.start_at as string,
    chairId: (row.chair_id as string) || undefined,
    createdAt: row.created_at as string,
  };
}

const memOccurrences: MeetingOccurrence[] = [];


export const store = {
  async listOrgs(): Promise<Organization[]> {
    if (!isSupabaseConfigured()) return memOrgs;
    const { data, error } = await getSupabase().from("organizations").select("*");
    if (error) throw error;
    return (data || []).map(rowToOrg);
  },

  async getOrg(id: string): Promise<Organization | null> {
    if (!isSupabaseConfigured()) return memOrgs.find((o) => o.id === id) || null;
    const { data, error } = await getSupabase()
      .from("organizations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToOrg(data) : null;
  },

  async listMeetings(organizationId?: string): Promise<Meeting[]> {
    if (!isSupabaseConfigured()) {
      return organizationId
        ? memMeetings.filter((m) => m.organizationId === organizationId)
        : memMeetings;
    }
    let q = getSupabase().from("meetings").select("*").order("start_at", { ascending: true });
    if (organizationId) q = q.eq("organization_id", organizationId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(rowToMeeting);
  },

  async getMeeting(id: string): Promise<Meeting | null> {
    if (!isSupabaseConfigured()) return memMeetings.find((m) => m.id === id) || null;
    const { data, error } = await getSupabase()
      .from("meetings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToMeeting(data) : null;
  },

  async createMeeting(
    input: Omit<Meeting, "id" | "createdAt" | "updatedAt" | "livekitRoomName"> & {
      livekitRoomName?: string;
    }
  ): Promise<Meeting> {
    const id = `mtg_${uuid().slice(0, 8)}`;
    const livekitRoomName = input.livekitRoomName || `ohg-${id}`;
    const now = new Date().toISOString();

    if (!isSupabaseConfigured()) {
      const meeting: Meeting = { ...input, id, livekitRoomName, createdAt: now, updatedAt: now };
      memMeetings.push(meeting);
      return meeting;
    }

    const { data, error } = await getSupabase()
      .from("meetings")
      .insert({
        id,
        organization_id: input.organizationId,
        name: input.name,
        description: input.description || null,
        type: input.type || null,
        host_id: input.hostId || input.chairId || null,
        chair_id: input.chairId || input.hostId || null,
        provider: input.provider,
        livekit_room_name: livekitRoomName,
        zoom_join_url: input.zoomJoinUrl || null,
        capacity: input.capacity,
        waiting_room_enabled: input.waitingRoomEnabled,
        password: input.password || null,
        recording_enabled: input.recordingEnabled,
        visibility: input.visibility,
        timezone: input.timezone,
        language: input.language,
        start_at: input.startAt,
        end_at: input.endAt || null,
        recurrence: input.recurrence || "none",
        recurrence_rule: input.recurrenceRule || null,
      })
      .select("*")
      .single();
    if (error && /recurrence_rule/i.test(error.message || "")) {
      const rest = {
        id,
        organization_id: input.organizationId,
        name: input.name,
        description: input.description || null,
        type: input.type || null,
        host_id: input.hostId || input.chairId || null,
        chair_id: input.chairId || input.hostId || null,
        provider: input.provider,
        livekit_room_name: livekitRoomName,
        zoom_join_url: input.zoomJoinUrl || null,
        capacity: input.capacity,
        waiting_room_enabled: input.waitingRoomEnabled,
        password: input.password || null,
        recording_enabled: input.recordingEnabled,
        visibility: input.visibility,
        timezone: input.timezone,
        language: input.language,
        start_at: input.startAt,
        end_at: input.endAt || null,
        recurrence: input.recurrence || "none",
      };
      const retry = await getSupabase().from("meetings").insert(rest).select("*").single();
      if (retry.error) throw retry.error;
      const m = rowToMeeting(retry.data);
      m.recurrenceRule = input.recurrenceRule;
      return m;
    }
    if (error) throw error;
    return rowToMeeting(data);
  },

  async updateMeeting(id: string, patch: Partial<Meeting>): Promise<Meeting | null> {
    if (!isSupabaseConfigured()) {
      const idx = memMeetings.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      memMeetings[idx] = { ...memMeetings[idx], ...patch, updatedAt: new Date().toISOString() };
      return memMeetings[idx];
    }
    const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) mapped.name = patch.name;
    if (patch.description !== undefined) mapped.description = patch.description;
    if (patch.type !== undefined) mapped.type = patch.type;
    if (patch.provider !== undefined) mapped.provider = patch.provider;
    if (patch.zoomJoinUrl !== undefined) mapped.zoom_join_url = patch.zoomJoinUrl;
    if (patch.capacity !== undefined) mapped.capacity = patch.capacity;
    if (patch.waitingRoomEnabled !== undefined) mapped.waiting_room_enabled = patch.waitingRoomEnabled;
    if (patch.recordingEnabled !== undefined) mapped.recording_enabled = patch.recordingEnabled;
    if (patch.visibility !== undefined) mapped.visibility = patch.visibility;
    if (patch.startAt !== undefined) mapped.start_at = patch.startAt;
    if (patch.chairId !== undefined) mapped.chair_id = patch.chairId;
    if (patch.hostId !== undefined) mapped.host_id = patch.hostId;
    if (patch.recurrence !== undefined) mapped.recurrence = patch.recurrence;
    if (patch.recurrenceRule !== undefined) mapped.recurrence_rule = patch.recurrenceRule;
    if (patch.timezone !== undefined) mapped.timezone = patch.timezone;
    if (patch.language !== undefined) mapped.language = patch.language;
    if (patch.enabled !== undefined) mapped.enabled = patch.enabled;
    let { data, error } = await getSupabase()
      .from("meetings")
      .update(mapped)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error && mapped.recurrence_rule !== undefined && /recurrence_rule/i.test(error.message || "")) {
      delete mapped.recurrence_rule;
      const retry = await getSupabase()
        .from("meetings")
        .update(mapped)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }
    if (error && mapped.enabled !== undefined && /enabled/i.test(error.message || "")) {
      delete mapped.enabled;
      const retry = await getSupabase()
        .from("meetings")
        .update(mapped)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      data = retry.data;
      error = retry.error;
      if (!error && data) {
        const mem = rowToMeeting(data);
        mem.enabled = patch.enabled;
        return mem;
      }
    }
    if (error) throw error;
    return data ? rowToMeeting(data) : null;
  },

  async deleteMeeting(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const idx = memMeetings.findIndex((m) => m.id === id);
      if (idx === -1) return false;
      memMeetings.splice(idx, 1);
      return true;
    }
    const { error } = await getSupabase().from("meetings").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async listMembers(organizationId?: string): Promise<UserProfile[]> {
    if (!isSupabaseConfigured()) {
      return organizationId
        ? memMembers.filter((m) => m.organizationId === organizationId)
        : memMembers;
    }
    let q = getSupabase().from("members").select("*").order("name");
    if (organizationId) q = q.eq("organization_id", organizationId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(rowToMember);
  },

  async getMember(id: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return memMembers.find((m) => m.id === id) || null;
    const { data, error } = await getSupabase()
      .from("members")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToMember(data) : null;
  },

  async createMember(data: Omit<UserProfile, "id"> & { id?: string }): Promise<UserProfile> {
    const member: UserProfile = {
      ...data,
      id: data.id || `user_${uuid().slice(0, 8)}`,
      privacy: data.privacy || DEFAULT_PRIVACY,
    };
    if (!isSupabaseConfigured()) {
      memMembers.push(member);
      return member;
    }
    const { data: row, error } = await getSupabase()
      .from("members")
      .insert({
        id: member.id,
        email: member.email,
        name: member.name,
        nickname: member.nickname || null,
        role: member.role,
        organization_id: member.organizationId || null,
        pronouns: member.pronouns || null,
        recovery_anniversary: member.recoveryAnniversary || null,
        timezone: member.timezone || null,
        avatar_url: member.avatarUrl || null,
        hide_last_name: member.privacy.hideLastName,
        hide_email: member.privacy.hideEmail,
        hide_attendance: member.privacy.hideAttendance,
        anonymous_display: member.privacy.anonymousDisplay,
      })
      .select("*")
      .single();
    if (error) throw error;
    return rowToMember(row);
  },

  async upsertClerkMember(input: {
    id: string;
    email: string;
    name: string;
    organizationId?: string;
  }): Promise<UserProfile> {
    const existing = await this.getMember(input.id);
    if (existing) return existing;
    return this.createMember({
      id: input.id,
      email: input.email,
      name: input.name,
      role: "member",
      organizationId: input.organizationId || "org_demo",
      privacy: DEFAULT_PRIVACY,
    });
  },

  async updateMemberRole(id: string, role: UserProfile["role"]): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) {
      const idx = memMembers.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      memMembers[idx] = { ...memMembers[idx], role };
      return memMembers[idx];
    }
    const { data, error } = await getSupabase()
      .from("members")
      .update({ role })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? rowToMember(data) : null;
  },

  async listAttendance(meetingId?: string, organizationId?: string): Promise<AttendanceRecord[]> {
    if (!isSupabaseConfigured()) {
      let list = memAttendance;
      if (meetingId) list = list.filter((a) => a.meetingId === meetingId);
      if (organizationId) list = list.filter((a) => a.organizationId === organizationId);
      return list;
    }
    let q = getSupabase().from("attendance").select("*").order("joined_at", { ascending: false });
    if (meetingId) q = q.eq("meeting_id", meetingId);
    if (organizationId) q = q.eq("organization_id", organizationId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(rowToAttendance);
  },

  async recordJoin(data: Omit<AttendanceRecord, "id" | "joinedAt">): Promise<AttendanceRecord> {
    const record: AttendanceRecord = {
      ...data,
      id: `att_${uuid().slice(0, 8)}`,
      joinedAt: new Date().toISOString(),
    };
    if (!isSupabaseConfigured()) {
      memAttendance.push(record);
      return record;
    }
    const { data: row, error } = await getSupabase()
      .from("attendance")
      .insert({
        id: record.id,
        meeting_id: record.meetingId,
        organization_id: record.organizationId,
        user_id: record.userId,
        display_name: record.displayName,
        joined_at: record.joinedAt,
        device: record.device || null,
        role: record.role,
      })
      .select("*")
      .single();
    if (error) throw error;
    return rowToAttendance(row);
  },

  async recordLeave(userId: string, meetingId: string): Promise<AttendanceRecord | null> {
    if (!isSupabaseConfigured()) {
      const rec = [...memAttendance]
        .reverse()
        .find((a) => a.userId === userId && a.meetingId === meetingId && !a.leftAt);
      if (!rec) return null;
      rec.leftAt = new Date().toISOString();
      rec.durationSeconds = Math.round(
        (new Date(rec.leftAt).getTime() - new Date(rec.joinedAt).getTime()) / 1000
      );
      return rec;
    }
    const { data: open } = await getSupabase()
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .eq("meeting_id", meetingId)
      .is("left_at", null)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!open) return null;
    const leftAt = new Date().toISOString();
    const durationSeconds = Math.round(
      (new Date(leftAt).getTime() - new Date(open.joined_at).getTime()) / 1000
    );
    const { data, error } = await getSupabase()
      .from("attendance")
      .update({ left_at: leftAt, duration_seconds: durationSeconds })
      .eq("id", open.id)
      .select("*")
      .single();
    if (error) throw error;
    return rowToAttendance(data);
  },

  async listOccurrences(meetingId: string): Promise<MeetingOccurrence[]> {
    if (!isSupabaseConfigured()) {
      return memOccurrences.filter((o) => o.meetingId === meetingId);
    }
    const { data, error } = await getSupabase()
      .from("meeting_occurrences")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("start_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(rowToOccurrence);
  },

  async upsertOccurrence(input: {
    meetingId: string;
    organizationId: string;
    startAt: string;
    chairId?: string | null;
  }): Promise<MeetingOccurrence> {
    const id = `occ_${input.meetingId}_${new Date(input.startAt).toISOString()}`;
    if (!isSupabaseConfigured()) {
      const existing = memOccurrences.find((o) => o.id === id);
      if (existing) {
        existing.chairId = input.chairId || undefined;
        return existing;
      }
      const occ: MeetingOccurrence = {
        id,
        meetingId: input.meetingId,
        organizationId: input.organizationId,
        startAt: input.startAt,
        chairId: input.chairId || undefined,
        createdAt: new Date().toISOString(),
      };
      memOccurrences.push(occ);
      return occ;
    }
    const { data, error } = await getSupabase()
      .from("meeting_occurrences")
      .upsert({
        id,
        meeting_id: input.meetingId,
        organization_id: input.organizationId,
        start_at: input.startAt,
        chair_id: input.chairId || null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return rowToOccurrence(data);
  },

  async setOccurrenceChair(id: string, chairId: string | null): Promise<MeetingOccurrence | null> {
    if (!isSupabaseConfigured()) {
      const occ = memOccurrences.find((o) => o.id === id);
      if (!occ) return null;
      occ.chairId = chairId || undefined;
      return occ;
    }
    const { data, error } = await getSupabase()
      .from("meeting_occurrences")
      .update({ chair_id: chairId })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? rowToOccurrence(data) : null;
  },
};
