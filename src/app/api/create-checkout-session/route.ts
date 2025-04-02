import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
    try {
        const headersList = headers();
        const origin =
            (await headersList).get("origin") || "http://localhost:3000";

        const { orderId, amount, currency } = await request.json();
        if (!orderId || !amount) {
            return NextResponse.json(
                { error: "Missing required fields: orderId or amount" },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "promptpay"],
            line_items: [
                {
                    price_data: {
                        currency: currency || "thb",
                        product_data: {
                            name: `Order #${orderId}`,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
            metadata: {
                orderId: String(orderId),
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
