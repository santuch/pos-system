// app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import pool from "@/lib/db";
import type { Stripe } from "stripe";

export const config = {
    runtime: "nodejs",
};

export async function POST(request: Request) {
    const sig = (await headers()).get("stripe-signature") || "";
    const rawBody = await request.text();

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 400 }
        );
    }

    if (event.type === "checkout.session.completed") {
        console.log("Received checkout.session.completed event");

        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const sessionId = session.id; // the Checkout Session ID
        const paymentIntentId = session.payment_intent as string;

        if (!orderId) {
            console.error("No orderId in session metadata");
            return NextResponse.json({ received: true }, { status: 200 });
        }

        try {
            // 1. Retrieve the PaymentIntent with expanded payment_method details
            const paymentIntent = await stripe.paymentIntents.retrieve(
                paymentIntentId,
                {
                    expand: ["payment_method"],
                }
            );

            // 2. Check the PaymentIntent’s payment_method object to find the actual type
            let actualPaymentMethod: string | null = null;
            if (
                paymentIntent.payment_method &&
                typeof paymentIntent.payment_method !== "string"
            ) {
                // payment_method is an object
                // For PromptPay, it might appear as paymentIntent.payment_method.type = "promptpay"
                actualPaymentMethod = paymentIntent.payment_method.type;
            }

            // 3. Update the database
            await pool.query(
                `UPDATE orders
         SET status = $1,
             stripe_session_id = $2,
             payment_intent_id = $3,
             payment_method = $4,
             updated_at = NOW()
         WHERE id = $5`,
                [
                    "paid",
                    sessionId,
                    paymentIntentId,
                    actualPaymentMethod || null,
                    orderId,
                ]
            );

            console.log(
                `Order #${orderId} updated to "paid" using method: ${actualPaymentMethod}`
            );
        } catch (dbError) {
            console.error("Error updating order status:", dbError);
        }
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
