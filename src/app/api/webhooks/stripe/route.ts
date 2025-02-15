import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import pool from "@/lib/db";
import type { Stripe } from "stripe";

export const config = {
    runtime: "nodejs", // Ensures we can read the raw body for Stripe verification
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
        const orderIdStr = session.metadata?.orderId;
        const sessionId = session.id;
        const paymentIntentId = session.payment_intent as string;

        if (!orderIdStr) {
            console.error("No orderId in session metadata");
            return NextResponse.json({ received: true }, { status: 200 });
        }

        const orderId = Number(orderIdStr);
        if (isNaN(orderId)) {
            console.error("Invalid orderId:", orderIdStr);
            return NextResponse.json({ received: true }, { status: 200 });
        }

        try {
            // Retrieve PaymentIntent details with expanded payment_method data
            const paymentIntent = await stripe.paymentIntents.retrieve(
                paymentIntentId,
                {
                    expand: ["payment_method"],
                }
            );
            console.log("PaymentIntent retrieved:", paymentIntent);

            let actualPaymentMethod: string = "card";
            if (
                paymentIntent.payment_method &&
                typeof paymentIntent.payment_method !== "string"
            ) {
                actualPaymentMethod = paymentIntent.payment_method.type;
            } else if (
                paymentIntent.payment_method_types &&
                paymentIntent.payment_method_types.length > 0
            ) {
                actualPaymentMethod = paymentIntent.payment_method_types[0];
            }
            console.log("Determined payment method:", actualPaymentMethod);

            // Update order status to 'paid' (only update columns that exist in orders)
            const updateResult = await pool.query(
                `UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`,
                [orderId]
            );
            console.log("Order updated, row count:", updateResult.rowCount);

            // Insert payment record into payments table
            await pool.query(
                `INSERT INTO payments (order_id, stripe_session_id, payment_intent_id, payment_method, payment_status)
         VALUES ($1, $2, $3, $4, 'succeeded')`,
                [orderId, sessionId, paymentIntentId, actualPaymentMethod]
            );
            console.log("Payment record created for order", orderId);
        } catch (dbError) {
            console.error("Error updating order/payment:", dbError);
        }
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
