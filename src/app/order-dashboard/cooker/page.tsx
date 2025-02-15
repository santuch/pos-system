"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SideNav from "@/components/SideNav";
import { Users, ClipboardList } from "lucide-react";

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
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    // Fetch orders that need kitchen attention (e.g., "in-progress" and "ready")
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/orders");
            const data = await res.json();
            // Filter orders that are "in-progress" or "ready"
            const filtered = data.filter(
                (order: Order) =>
                    order.status === "in-progress" || order.status === "ready"
            );
            setOrders(filtered);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    // Update order status using PATCH endpoint
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
        <div className="flex h-screen bg-gray-100">
            <SideNav />
            <div className="flex-1 overflow-y-auto p-8">
                <h1 className="text-3xl font-bold mb-6">Cooker Dashboard</h1>
                {loading ? (
                    <p>Loading orders...</p>
                ) : orders.length === 0 ? (
                    <p>No orders to display.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orders.map((order) => (
                            <Card key={order.id} className="shadow">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span>Order #{order.id}</span>
                                        <Badge variant="secondary">
                                            {order.status}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <Users className="mr-2 h-4 w-4" />
                                            <span>
                                                Table {order.table_number}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <ClipboardList className="mr-2 h-4 w-4" />
                                            <span>
                                                {order.number_of_customers}{" "}
                                                customers
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <p className="font-semibold">
                                                Items to Prepare:
                                            </p>
                                            {order.items &&
                                            order.items.length > 0 ? (
                                                order.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="ml-4"
                                                    >
                                                        <p>
                                                            {item.name} —{" "}
                                                            <span className="font-medium">
                                                                {item.quantity}
                                                            </span>{" "}
                                                            unit
                                                            {item.quantity > 1
                                                                ? "s"
                                                                : ""}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="ml-4 text-gray-500">
                                                    No items
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    {order.status === "in-progress" && (
                                        <Button
                                            className="w-full"
                                            onClick={() =>
                                                updateStatus(
                                                    order.id,
                                                    "waiting-for-payment"
                                                )
                                            }
                                        >
                                            Mark as Ready
                                        </Button>
                                    )}
                                    {order.status === "ready" && (
                                        <p className="text-green-600 font-bold w-full text-center">
                                            Order Ready!
                                        </p>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
