"use client";

import React from "react";

export default function CancelPage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen p-4">
            <h1 className="text-3xl font-bold mb-4">Payment Canceled</h1>
            <p className="text-lg mb-6">
                Your payment was canceled. You can try again at any time.
            </p>
            <a
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                href="/order-dashboard/payment"
            >
                Return to Payment Dashboard
            </a>
        </div>
    );
}
