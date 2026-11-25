import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type AuditOutcome = 'success' | 'failure' | 'blocked' | 'pending';

export type AuditEvent = {
  eventType: string;
  outcome?: AuditOutcome;
  userId?: string | null;
  orderId?: string | null;
  provider?: string | null;
  amount?: number | null;
  currency?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
};

/** Best-effort audit logging: observability must never make checkout fail. */
export async function recordAuditEvent(
  db: SupabaseClient,
  event: AuditEvent,
): Promise<void> {
  const { error } = await db.from('audit_events').insert({
    event_type: event.eventType,
    outcome: event.outcome ?? 'success',
    user_id: event.userId ?? null,
    order_id: event.orderId ?? null,
    provider: event.provider ?? null,
    amount: event.amount ?? null,
    currency: event.currency ?? null,
    correlation_id: event.correlationId ?? null,
    metadata: event.metadata ?? {},
  });
  if (error) console.error('audit event write failed', error.message);
}
