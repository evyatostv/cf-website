import Stripe from 'npm:stripe@17';
import {createClient} from 'npm:@supabase/supabase-js@2';

const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const intentIdPattern = /^pi_[A-Za-z0-9]+$/;
const plans = new Set(['basic','professional','full','forever']);
const checkoutEvents = new Set(['checkout.session.completed','checkout.session.async_payment_succeeded']);
const supported = new Set([...checkoutEvents,'payment_intent.succeeded','charge.refunded','charge.dispute.closed']);
const objectId = (ref: unknown) => typeof ref === 'string' ? ref :
  ref && typeof ref === 'object' && 'id' in ref && typeof ref.id === 'string' ? ref.id : null;

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response(null,{status:405});
  const header = req.headers.get('stripe-signature');
  if (!header) return new Response(null,{status:400});
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secret || !key) return new Response(null,{status:503});
  const stripe = new Stripe(key);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(),header,secret);
  } catch {
    return new Response(null,{status:400});
  }
  const accepted = () => Response.json({received:true});
  if (!event.livemode || !supported.has(event.type)) return accepted();
  try {
    const object = event.data.object;
    const eventObjectId = objectId(object);
    if (!eventObjectId) return new Response(null,{status:409});
    // Unpaid delayed checkout will be retried via async_payment_succeeded.
    if (checkoutEvents.has(event.type) && (object as Stripe.Checkout.Session).payment_status !== 'paid') return accepted();
    const intentId = event.type === 'payment_intent.succeeded' ? eventObjectId :
      objectId((object as Stripe.Charge | Stripe.Dispute | Stripe.Checkout.Session).payment_intent);
    if (!intentId || !intentIdPattern.test(intentId)) return new Response(null,{status:409});
    const intent = await stripe.paymentIntents.retrieve(intentId,{expand:['latest_charge']});
    const charge = intent.latest_charge as Stripe.Charge | null;
    if (!intent.livemode || intent.id !== intentId || intent.status !== 'succeeded' || intent.currency !== 'ils' ||
        !Number.isSafeInteger(intent.amount_received) || intent.amount_received <= 0 || intent.amount !== intent.amount_received ||
        !charge?.livemode || !charge.paid || !charge.captured || charge.currency !== 'ils' ||
        objectId(charge.payment_intent) !== intentId || charge.amount_captured !== intent.amount_received ||
        !Number.isSafeInteger(charge.amount_refunded) || charge.amount_refunded < 0 || charge.amount_refunded > charge.amount_captured) {
      return new Response(null,{status:409});
    }

    // Historical Checkout stored account metadata on the session only and
    // recorded its cs_ ID. Resolve that alias even for payment-intent deliveries.
    const sessions = await stripe.checkout.sessions.list({payment_intent:intentId,limit:2});
    if (sessions.has_more || sessions.data.length>1) return new Response(null,{status:409});
    const session = sessions.data[0];
    if (checkoutEvents.has(event.type) && session?.id !== eventObjectId) return new Response(null,{status:409});
    const meta = session?.metadata || intent.metadata;
    if (!meta || !uuid.test(meta.userId || '') || !plans.has(meta.plan) ||
        (intent.metadata?.userId && intent.metadata.userId !== meta.userId) ||
        (intent.metadata?.plan && intent.metadata.plan !== meta.plan)) return new Response(null,{status:409});
    let credit = 0;
    if (session) {
      if (!session.livemode || session.mode !== 'payment' || session.payment_status !== 'paid' ||
          session.currency !== 'ils' || session.amount_total !== intent.amount_received ||
          objectId(session.payment_intent) !== intentId) return new Response(null,{status:409});
      const lines = await stripe.checkout.sessions.listLineItems(session.id,{limit:2});
      const line = lines.data[0];
      const expectedPrice = Deno.env.get('STRIPE_PRICE_'+meta.plan.toUpperCase());
      if (lines.has_more || lines.data.length!==1 || line.quantity!==1 || !line.price ||
          (expectedPrice && line.price.id !== expectedPrice) || line.price.currency !== 'ils' || line.price.unit_amount !== intent.amount_received) {
        return new Response(null,{status:409});
      }
    } else if (intent.metadata.discountAmount !== undefined) {
      if (!/^(0|[1-9]\d{0,6})$/.test(intent.metadata.discountAmount)) return new Response(null,{status:409});
      credit=Number(intent.metadata.discountAmount);
    }
    let state = 'paid';
    if (charge.refunded && charge.amount_refunded===charge.amount_captured) state='refunded';
    else if (charge.amount_refunded>0 || charge.disputed) state='review';
    if (event.type==='charge.refunded' && (eventObjectId!==charge.id || state==='paid')) return new Response(null,{status:409});
    if (event.type==='charge.dispute.closed') {
      const dispute = await stripe.disputes.retrieve(eventObjectId);
      if (!dispute.livemode || objectId(dispute.charge)!==charge.id || objectId(dispute.payment_intent)!==intent.id)
        return new Response(null,{status:409});
      if (dispute.status==='lost') state=dispute.amount===charge.amount_captured ? 'refunded' : 'review';
      else if (state==='paid') return accepted();
    }
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {data,error}=await db.rpc('record_verified_stripe_order',{
      p_intent:intent.id,p_session:session?.id || null,p_user:meta.userId,p_plan:meta.plan,
      p_charged:intent.amount_received,p_credit:credit,p_created:intent.created,p_state:state,
    });
    if (error) return new Response(null,{status:503});
    if (!['RECORDED','DUPLICATE','HELD'].includes(data)) {
      console.warn('Stripe settlement requires billing review');
      return new Response(null,{status:409});
    }
    return accepted();
  } catch {
    console.error('Stripe settlement verification unavailable');
    return new Response(null,{status:503});
  }
});
