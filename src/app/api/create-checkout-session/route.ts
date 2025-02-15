import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
    try {
        const headersList = headers();
        const origin = (await headersList).get("origin");
        const { orderId, amount, currency } = await request.json();

        if (!orderId || !amount) {
            console.error("Missing required fields:", {
                orderId,
                amount,
                currency,
            });
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Here we assume `amount` is already in satang (integer).
        console.log("Creating checkout session:", {
            orderId,
            amount,
            currency,
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "promptpay"], // Add other supported methods as needed
            line_items: [
                {
                    price_data: {
                        currency: currency || "thb", // Set currency to THB
                        product_data: { name: `Order #${orderId}` },
                        unit_amount: amount, // Amount in satang; no extra conversion here.
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
            metadata: { orderId: String(orderId) },
        });

        console.log("Checkout session created:", session.id);
        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
