"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import SideNav from "@/components/SideNav";

type OrderItem = {
    id: number;
    name: string;
    price: number;
    quantity: number;
};

type Order = {
    id: number;
    table_number: string;
    number_of_customers: number;
    items: OrderItem[];
    total_price: number | string;
    status: string;
};

export default function PaymentDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    // Fetch orders waiting for payment
    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/orders");
            const data = await res.json();
            // Filter orders that are waiting for payment
            const filtered = data.filter(
                (order: Order) => order.status === "waiting-for-payment"
            );
            setOrders(filtered);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    // Update order status (e.g., marking as paid)
    const updateStatus = async (orderId: number, newStatus: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                fetchOrders();
            } else {
                console.error("Failed to update order status");
            }
        } catch (error) {
            console.error("Error updating order status:", error);
        }
    };

    return (
        <div className="flex h-screen">
            <SideNav />
            <div className="flex-1 overflow-y-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Payment Dashboard</h1>
                {loading ? (
                    <p>Loading orders...</p>
                ) : orders.length === 0 ? (
                    <p>No orders waiting for payment.</p>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="border p-4 my-2 rounded">
                            <div className="flex justify-between items-center">
                                <p>
                                    <strong>Order ID:</strong> {order.id}
                                </p>
                                <p>
                                    <strong>Status:</strong> {order.status}
                                </p>
                            </div>
                            <p>
                                <strong>Table:</strong> {order.table_number}
                            </p>
                            <p>
                                <strong>Customers:</strong>{" "}
                                {order.number_of_customers}
                            </p>
                            <p>
                                <strong>Total:</strong> $
                                {Number(order.total_price).toFixed(2)}
                            </p>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    onClick={() =>
                                        updateStatus(order.id, "paid")
                                    }
                                >
                                    Mark as Paid
                                </Button>
                                <Button
                                    onClick={() =>
                                        updateStatus(order.id, "cancelled")
                                    }
                                >
                                    Cancel Order
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
