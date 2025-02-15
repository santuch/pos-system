import React from "react";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";

interface SuccessPageProps {
    searchParams: { session_id?: string };
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
    const { session_id } = searchParams;

    if (!session_id) {
        // If there's no session_id, redirect to home or an error page
        return redirect("/");
    }

    // Optionally, retrieve the session details from Stripe for display
    const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["payment_intent", "customer"],
    });

    // If you want to show the user some details, you can get them from `session`
    const paymentStatus = session.payment_status; // e.g. "paid", "unpaid", "no_payment_required"

    return (
        <div className="flex flex-col items-center justify-center h-screen p-4">
            <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-lg mb-6">
                Thank you for your purchase. Payment status:{" "}
                <strong>{paymentStatus}</strong>
            </p>
            <a
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                href="/order-dashboard/payment"
            >
                Go to Payment Dashboard
            </a>
        </div>
    );
}
