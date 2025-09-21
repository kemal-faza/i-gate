"use server";

import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase";

function isUuid(input: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    input.trim(),
  );
}

export type ScanTicketResult =
  | {
      status: "success";
      code: string;
      alreadyCheckedIn: boolean;
      attendee: {
        name: string;
        email: string;
        nim: string;
        tierLabel: string;
      };
      checkedInAt: string;
      checkedInBy: string;
    }
  | {
      status: "already";
      code: string;
      attendee: {
        name: string;
        email: string;
        nim: string;
        tierLabel: string;
      };
      checkedInAt: string;
      checkedInBy: string;
    }
  | {
      status: "unpaid";
      code: string;
    }
  | {
      status: "not_found";
      code: string;
    }
  | {
      status: "error";
      code?: string;
      message: string;
    };

export async function scanTicketAction(
  rawCode: string,
): Promise<ScanTicketResult> {
  const code = rawCode.trim();
  if (!code || !isUuid(code)) {
    return { status: "not_found", code };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, name, email, nim, tier_label, tier_key")
      .eq("id", code)
      .maybeSingle();

    if (error) {
      console.error("scanTicketAction order fetch error", error);
      return { status: "error", code, message: "Failed to lookup order" };
    }

    if (!order) {
      return { status: "not_found", code };
    }

    if (order.status !== "paid") {
      return { status: "unpaid", code };
    }

    const { data: existingEvent, error: eventError } = await supabase
      .from("event")
      .select("id, checked_in_at, checked_in_by")
      .eq("order_id", order.id)
      .maybeSingle();

    if (eventError) {
      console.error("scanTicketAction event fetch error", eventError);
      return { status: "error", code, message: "Failed to check attendance" };
    }

    const attendee = {
      name: order.name,
      email: order.email,
      nim: order.nim,
      tierLabel: order.tier_label ?? order.tier_key,
    };

    if (existingEvent) {
      return {
        status: "already",
        code,
        attendee,
        checkedInAt: existingEvent.checked_in_at,
        checkedInBy: existingEvent.checked_in_by ?? "unknown",
      };
    }

    const headerStore = await headers();
    const operator = headerStore.get("x-admin-user") ?? "system";

    const { data: inserted, error: insertError } = await supabase
      .from("event")
      .insert({
        order_id: order.id,
        ticket_code: code,
        attendee_name: order.name,
        checked_in_by: operator,
      })
      .select("checked_in_at, checked_in_by")
      .single();

    if (insertError || !inserted) {
      console.error("scanTicketAction insert error", insertError);
      return {
        status: "error",
        code,
        message: "Failed to store attendance",
      };
    }

    return {
      status: "success",
      code,
      alreadyCheckedIn: false,
      attendee,
      checkedInAt: inserted.checked_in_at,
      checkedInBy: inserted.checked_in_by ?? operator,
    };
  } catch (error) {
    console.error("scanTicketAction unexpected error", error);
    return {
      status: "error",
      code,
      message: "Unexpected server error",
    };
  }
}

export type AttendanceRow = {
  id: string;
  ticketCode: string;
  attendeeName: string | null;
  checkedInAt: string;
  checkedInBy: string | null;
};

export async function getRecentAttendancesAction(
  limit = 12,
): Promise<AttendanceRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("event")
    .select("id, ticket_code, attendee_name, checked_in_at, checked_in_by")
    .order("checked_in_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentAttendancesAction error", error);
    return [];
  }

  return (
    data?.map((row) => ({
      id: row.id,
      ticketCode: row.ticket_code,
      attendeeName: row.attendee_name,
      checkedInAt: row.checked_in_at,
      checkedInBy: row.checked_in_by,
    })) ?? []
  );
}
