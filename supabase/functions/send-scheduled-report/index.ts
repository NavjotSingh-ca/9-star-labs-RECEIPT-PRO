// Edge Function: send-scheduled-report
// Triggered by pg_cron via supabase cron job
// Generates a scheduled report and emails it to recipients

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

interface Schedule {
  id: string;
  org_id: string;
  created_by: string;
  report_name: string;
  report_config: Record<string, unknown>;
  frequency: string;
  email_to: string;
  format: string;
  day_of_week: number | null;
  day_of_month: number | null;
  time_of_day: string;
  next_run_at: string;
  is_active: boolean;
}

serve(async (req: Request) => {
  // Auth check — called by cron via Authorization header
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("SMTP not configured");
      return new Response(JSON.stringify({ error: "SMTP not configured" }), { status: 500 });
    }

    // Support manual trigger with schedule_id
    if (req.method === "POST") {
      const { schedule_id } = await req.json();
      if (schedule_id) {
        const { data: schedule, error } = await supabase
          .from("report_schedules")
          .select("*")
          .eq("id", schedule_id)
          .eq("is_active", true)
          .single();
        if (error || !schedule) {
          return new Response(JSON.stringify({ error: "Schedule not found" }), { status: 404 });
        }
        const result = await processSchedule(supabase, smtpHost, smtpUser, smtpPass, schedule as Schedule);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
      }
    }

    // Batch: find schedules due to run
    const now = new Date();
    const { data: schedules, error } = await supabase
      .from("report_schedules")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", now.toISOString());

    if (error) {
      console.error("Failed to fetch schedules:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const results = [];
    for (const schedule of (schedules as Schedule[]) || []) {
      const result = await processSchedule(supabase, smtpHost, smtpUser, smtpPass, schedule);

      // Update next_run_at if delivered
      if (result.status === "delivered") {
        const nextRun = computeNextRunAt(schedule);
        await supabase
          .from("report_schedules")
          .update({ next_run_at: nextRun })
          .eq("id", schedule.id);
      }

      results.push(result);
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-scheduled-report error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});

function computeNextRunAt(schedule: Schedule): string {
  const now = new Date();
  const [hours, minutes] = (schedule.time_of_day || "08:00").split(":").map(Number);
  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);

  if (schedule.frequency === "daily") {
    candidate.setDate(candidate.getDate() + 1);
    return candidate.toISOString();
  }
  if (schedule.frequency === "weekly") {
    const targetDay = schedule.day_of_week ?? 1;
    candidate.setDate(candidate.getDate() + ((targetDay + 7 - candidate.getDay()) % 7 || 7));
    return candidate.toISOString();
  }
  if (schedule.frequency === "monthly" || schedule.frequency === "quarterly") {
    const targetDay = schedule.day_of_month ?? 1;
    const months = schedule.frequency === "quarterly" ? 3 : 1;
    candidate.setMonth(candidate.getMonth() + months);
    const lastDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
    candidate.setDate(Math.min(targetDay, lastDay));
    return candidate.toISOString();
  }

  candidate.setDate(candidate.getDate() + 7);
  return candidate.toISOString();
}

async function processSchedule(
  supabase: any,
  smtpHost: string,
  smtpUser: string,
  smtpPass: string,
  schedule: Schedule,
) {
  const config = schedule.report_config || {};
  const metrics = (config.metrics as string[]) || ["total_spend", "receipt_count"];
  const datePreset = (config.datePreset as string) || "this_month";
  const groupBy = (config.groupBy as string) || null;

  try {
    // Generate report via RPC
    const { data: reportData, error: rpcError } = await supabase.rpc("generate_report", {
      p_org_id: schedule.org_id,
      p_metrics: metrics,
      p_group_by: groupBy,
      p_date_from: resolveDatePreset(datePreset).start,
      p_date_to: resolveDatePreset(datePreset).end,
      p_categories: null,
      p_vendors: null,
      p_projects: null,
      p_business_units: null,
      p_approval_status: null,
      p_min_amount: null,
      p_max_amount: null,
    });

    if (rpcError) throw rpcError;

    // Build HTML email body
    const rows = reportData || [];
    const htmlBody = buildEmailHtml(schedule.report_name, rows, schedule.format);

    // Send email
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: 587,
        tls: true,
        auth: { username: smtpUser, password: smtpPass },
      },
    });

    const recipientEmails = schedule.email_to.split(",").map((e) => e.trim()).filter(Boolean);
    for (const email of recipientEmails) {
      await client.send({
        from: smtpUser,
        to: email,
        subject: `[9 Star Labs Receipt Pro] ${schedule.report_name} — ${new Date().toLocaleDateString("en-CA")}`,
        content: htmlBody,
        html: htmlBody,
      });
    }

    await client.close();

    // Log delivery
    await supabase.from("report_deliveries").insert({
      schedule_id: schedule.id,
      org_id: schedule.org_id,
      recipient_count: recipientEmails.length,
      status: "delivered",
    });

    return { scheduleId: schedule.id, status: "delivered", rows: rows.length };
  } catch (err) {
    console.error(`Schedule ${schedule.id} failed:`, err);

    await supabase.from("report_deliveries").insert({
      schedule_id: schedule.id,
      org_id: schedule.org_id,
      recipient_count: schedule.email_to.split(",").length,
      status: "failed",
      error_message: String(err),
    });

    return { scheduleId: schedule.id, status: "failed", error: String(err) };
  }
}

function resolveDatePreset(preset: string): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case "this_month":
      return {
        start: `${y}-${String(m + 1).padStart(2, "0")}-01`,
        end: new Date(y, m + 1, 0).toISOString().slice(0, 10),
      };
    case "last_month":
      return {
        start: `${y}-${String(m).padStart(2, "0")}-01`,
        end: new Date(y, m, 0).toISOString().slice(0, 10),
      };
    case "this_quarter": {
      const q = Math.floor(m / 3) * 3;
      return {
        start: `${y}-${String(q + 1).padStart(2, "0")}-01`,
        end: new Date(y, q + 3, 0).toISOString().slice(0, 10),
      };
    }
    case "this_year":
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    case "last_year":
      return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31` };
    default:
      return {
        start: `${y}-${String(m + 1).padStart(2, "0")}-01`,
        end: new Date(y, m + 1, 0).toISOString().slice(0, 10),
      };
  }
}

function buildEmailHtml(name: string, rows: any[], format: string): string {
  if (!rows || rows.length === 0) {
    return `<h2>${name}</h2><p>No data for this period.</p>`;
  }

  const headers = Object.keys(rows[0]);
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${headers
          .map(
            (h) =>
              `<td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: ${
                typeof row[h] === "number" ? "right" : "left"
              }">${row[h] ?? ""}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("\n");

  return `
    <h2 style="color: #09090b; margin-bottom: 8px;">${name}</h2>
    <p style="color: #71717a; font-size: 12px;">Generated ${new Date().toLocaleDateString("en-CA")}</p>
    <p style="color: #71717a; font-size: 11px;">Format: ${format.toUpperCase()}</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background: #f4f4f5;">
          ${headers
            .map(
              (h) =>
                `<th style="padding: 8px 12px; text-align: ${
                  typeof rows[0][h] === "number" ? "right" : "left"
                }; font-weight: 600; text-transform: uppercase; font-size: 10px; color: #71717a;">${h}</th>`,
            )
            .join("")}
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <p style="color: #71717a; font-size: 10px; margin-top: 16px;">
      Sent by 9 Star Labs Receipt Pro. Configure delivery in Settings.
    </p>
  `;
}
