import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import pool from "@/lib/db";

export async function POST(request: Request) {
    const headersList = headers();
    const origin = (await headersList).get("origin") || "http://localhost:3000";

    const { orderId, amount, currency, couponCode } = await request.json();

    if (!orderId || !amount) {
        return NextResponse.json(
            { error: "Missing required fields: orderId or amount" },
            { status: 400 }
        );
    }

    let discountedAmount = amount;
    let couponId = null;
    let discountAmount = null;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        if (couponCode) {
            const couponQuery = `
        SELECT * FROM coupons
        WHERE code = $1
      `;
            const couponResult = await client.query(couponQuery, [couponCode]);
            const coupon = couponResult.rows[0];

            if (!coupon) {
                await client.query("ROLLBACK");
                return NextResponse.json(
                    { error: "Invalid coupon code" },
                    { status: 400 }
                );
            }

            const now = new Date();
            if (
                (coupon.start_date && now < coupon.start_date) ||
                now > coupon.expiration_date
            ) {
                await client.query("ROLLBACK");
                return NextResponse.json(
                    { error: "Coupon has expired" },
                    { status: 400 }
                );
            }

            if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
                await client.query("ROLLBACK");
                return NextResponse.json(
                    { error: "Coupon has reached its usage limit" },
                    { status: 400 }
                );
            }

            console.log(`amount: ${amount}`);
            console.log(`coupon.discount_type: ${coupon.discount_type}`);
            console.log(`coupon.discount_value: ${coupon.discount_value}`);

            if (coupon.discount_type === "percentage") {
                discountAmount = Math.round(amount * (coupon.discount_value / 100));
                discountedAmount = amount - discountAmount;
            } else if (coupon.discount_type === "fixed") {
                discountAmount = coupon.discount_value; // Corrected: No * 100
                discountedAmount = amount - discountAmount;
            }

            console.log(`discountAmount: ${discountAmount}`);
            console.log(`discountedAmount: ${discountedAmount}`);

            couponId = coupon.id;

            const updateCouponQuery = `
        UPDATE coupons
        SET times_used = times_used + 1
        WHERE id = $1
      `;
            await client.query(updateCouponQuery, [coupon.id]);
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
                        unit_amount: discountedAmount,
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

        // Update the order with coupon and discount information
        const updateOrderQuery = `
      UPDATE orders
      SET coupon_id = $1, discount_amount = $2
      WHERE id = $3
    `;
        await client.query(updateOrderQuery, [couponId, discountAmount, orderId]);

        await client.query("COMMIT");
        console.log(`Returning discountAmount: ${discountAmount}`);
        // Ensure discountAmount is always returned, even if null
        return NextResponse.json({ url: session.url, discountAmount: discountAmount !== null ? discountAmount : 0 });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error creating checkout session:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
