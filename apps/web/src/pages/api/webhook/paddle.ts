import type { APIRoute } from 'astro';

/**
 * Paddle Webhook Handler
 * Handles subscription events and updates tenant status
 */
export const POST: APIRoute = async ({ request, locals }) => {
    const db = (locals as any).runtime?.env?.DB;
    const webhookSecret = (locals as any).runtime?.env?.PADDLE_WEBHOOK_SECRET;

    if (!db) {
        return new Response('Database missing', { status: 500 });
    }

    // signature verification would go here in production
    // For now, we will parse the event and match the tenantId via customData

    try {
        const body = await request.json();
        const eventType = body.event_type;
        const data = body.data;

        console.log(`Paddle Webhook received: ${eventType}`);

        // Handle subscription events
        if (eventType.startsWith('subscription.')) {
            const subscriptionId = data.id;
            const customerId = data.customer_id;
            const status = data.status;
            const tenantId = data.custom_data?.tenantId;
            const endsAt = data.current_billing_period?.ends_at;

            if (tenantId) {
                // Update tenant status
                // If status is 'active' or 'trialing', set plan to 'pro'
                const plan = (status === 'active' || status === 'trialing') ? 'pro' : 'free';

                await db.prepare(`
                    UPDATE tenants 
                    SET plan = ?, 
                        paddle_subscription_id = ?, 
                        paddle_customer_id = ?,
                        subscription_status = ?,
                        subscription_ends_at = ?
                    WHERE id = ?
                `)
                    .bind(
                        plan,
                        subscriptionId,
                        customerId,
                        status,
                        endsAt ? Math.floor(new Date(endsAt).getTime() / 1000) : null,
                        tenantId
                    )
                    .run();

                return new Response(JSON.stringify({ success: true, message: 'Tenant updated' }));
            }
        }

        return new Response(JSON.stringify({ success: true, message: 'Event ignored' }));
    } catch (err) {
        console.error('Paddle Webhook Error:', err);
        return new Response('Webhook Error', { status: 400 });
    }
};
