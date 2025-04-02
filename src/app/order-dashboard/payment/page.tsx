"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, DollarSign, Users } from "lucide-react";
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/orders");
            const data = await res.json();
            const filtered = data.filter(
                (order: Order) => order.status === "waiting-for-payment"
            );
            setOrders(filtered);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCashPayment = async (order: Order) => {
        try {
            // First update the order status to 'paid'
            const statusRes = await fetch(`/api/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "paid" }),
            });
            
            // Then create a payment record for the cash payment
            const paymentRes = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: order.id,
                    paymentMethod: "cash",
                    paymentStatus: "succeeded"
                }),
            });
            
            if (statusRes.ok && paymentRes.ok) {
                fetchOrders(); // Refresh the orders list
            } else {
                console.error("Failed to process cash payment");
            }
        } catch (error) {
            console.error("Error processing cash payment:", error);
        }
    };

    const handleStripePayment = async (order: Order) => {
        try {
            const rawTotal = Number(order.total_price);
            const amountInSatang = Math.round(rawTotal * 100);

            console.log(
                `Processing payment for order ${order.id}: raw total ${rawTotal} THB, converted to ${amountInSatang} satang.`
            );

            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: order.id,
                    amount: amountInSatang,
                    currency: "thb",
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("Failed to create checkout session", data);
            }
        } catch (error) {
            console.error("Error processing Stripe payment:", error);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <SideNav />
            <div className="flex-1 overflow-y-auto p-8">
                <h1 className="text-3xl font-bold mb-6">Payment Dashboard</h1>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <Skeleton className="h-4 w-[250px]" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-[200px] mb-2" />
                                    <Skeleton className="h-4 w-[150px] mb-2" />
                                    <Skeleton className="h-4 w-[100px]" />
                                </CardContent>
                                <CardFooter>
                                    <Skeleton className="h-10 w-full" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex items-center justify-center h-32">
                            <p className="text-lg text-gray-500">
                                No orders waiting for payment.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orders.map((order) => (
                            <Card key={order.id}>
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
                                            <Users className="mr-2 h-4 w-4" />
                                            <span>
                                                {order.number_of_customers}{" "}
                                                customers
                                            </span>
                                        </div>
                                        <div className="flex items-center font-bold">
                                            <DollarSign className="mr-2 h-4 w-4" />
                                            <span>
                                                {Number(
                                                    order.total_price
                                                ).toFixed(2)}{" "}
                                                THB
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-2">
                                    <Button
                                        className="w-full"
                                        onClick={() =>
                                            handleStripePayment(order)
                                        }
                                    >
                                        <CreditCard className="mr-2 h-4 w-4" />{" "}
                                        Pay with Stripe
                                    </Button>
                                    <div className="flex gap-2 w-full">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() =>
                                            handleCashPayment(order)
                                            }
                                        >
                                            Mark as Paid
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`/api/orders/${order.id}`, {
                                                        method: "PATCH",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ status: "cancelled" }),
                                                    });
                                                    if (res.ok) {
                                                        fetchOrders();
                                                    }
                                                } catch (error) {
                                                    console.error("Error cancelling order:", error);
                                                }
                                            }}
                                        >
                                            Cancel Order
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
