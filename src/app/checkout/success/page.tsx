import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { CheckCircle2 } from "lucide-react";

interface SuccessPageProps {
    searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
    const { session_id } = await (await searchParams);

    if (!session_id) {
        return redirect("/");
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["payment_intent", "customer"],
    });

    const paymentStatus = session.payment_status;
    const amount_total = session.amount_total;

    return (
        <div className="flex flex-col items-center justify-center h-screen p-4">
            <div className="mb-4 relative">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-[scaleIn_0.5s_ease-out]">
                    <CheckCircle2 className="w-12 h-12 text-green-500 animate-[checkmark_0.5s_ease-out_0.2s]" />
                </div>
                <div className="absolute -inset-1 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
            </div>
            <h1 className="text-gray-600 mb-4 animate-[fadeIn_0.5s_ease-out_0.4s]">
                Total Amount: $
                {(Number(amount_total || 0) / 100).toFixed(2)}
            </h1>
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
