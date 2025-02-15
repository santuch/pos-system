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

export default function CookerDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    // Fetch orders from the API and filter for those that need kitchen attention
    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/orders");
            const data = await res.json();
            // For the kitchen, we care about orders that are in-progress or ready (to be served)
            const filtered = data.filter(
                (order: Order) =>
                    order.status === "in-progress" || order.status === "ready"
            );
            setOrders(filtered);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    // Update order status by calling the PATCH endpoint
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
                <h1 className="text-2xl font-bold mb-4">Cooker Dashboard</h1>
                {loading ? (
                    <p>Loading orders...</p>
                ) : orders.length === 0 ? (
                    <p>No orders to display.</p>
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
                            <div className="mt-2">
                                <p className="font-semibold">
                                    Items to Prepare:
                                </p>
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item) => (
                                        <div key={item.id} className="ml-4">
                                            <p>
                                                {item.name} —{" "}
                                                <span className="font-medium">
                                                    {item.quantity}
                                                </span>{" "}
                                                unit
                                                {item.quantity > 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="ml-4">No items</p>
                                )}
                            </div>
                            <div className="flex gap-2 mt-4">
                                {order.status === "in-progress" && (
                                    <Button
                                        onClick={() =>
                                            updateStatus(order.id, "ready")
                                        }
                                    >
                                        Mark as Ready
                                    </Button>
                                )}
                                {order.status === "ready" && (
                                    <Button
                                        onClick={() =>
                                            updateStatus(
                                                order.id,
                                                "waiting-for-payment"
                                            )
                                        }
                                    >
                                        Mark as Served
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
