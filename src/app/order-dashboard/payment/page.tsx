"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
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

// Define a type for the Stripe payment payload.
interface StripePaymentPayload {
    orderId: number;
    amount: number;
    currency: string;
    couponCode?: string;
}

export default function PaymentDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [couponCodes, setCouponCodes] = useState<{
        [orderId: number]: string;
    }>({});
    const [discountedPrices, setDiscountedPrices] = useState<{
        [orderId: number]: number;
    }>({});
    const [couponError, setCouponError] = useState<{
        [orderId: number]: string;
    }>({});

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

    const handleApplyCoupon = async (order: Order) => {
        try {
            const rawTotal = Number(order.total_price);
            const amountInSatang = Math.round(rawTotal * 100);
            const couponCode = couponCodes[order.id]?.trim() || "";

            if (couponCode) {
                const res = await fetch("/api/create-checkout-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        orderId: order.id,
                        amount: amountInSatang,
                        currency: "thb",
                        couponCode: couponCode,
                    }),
                });
                const data = await res.json();

                if (data.error) {
                    // Coupon is invalid or expired: show error and clear discounted price
                    setCouponError((prevErrors) => ({
                        ...prevErrors,
                        [order.id]: data.error,
                    }));
                    setDiscountedPrices((prevPrices) => {
                        const newPrices = { ...prevPrices };
                        delete newPrices[order.id];
                        return newPrices;
                    });
                } else if (data.discountAmount !== undefined) {
                    // Coupon is valid: apply discount
                    setDiscountedPrices((prevPrices) => ({
                        ...prevPrices,
                        [order.id]: amountInSatang - data.discountAmount * 100,
                    }));
                    setCouponError((prevErrors) => ({
                        ...prevErrors,
                        [order.id]: "",
                    }));
                } else {
                    console.error(
                        "Invalid data format: missing discountAmount",
                        data
                    );
                    setCouponError((prevErrors) => ({
                        ...prevErrors,
                        [order.id]: "Invalid coupon response",
                    }));
                    setDiscountedPrices((prevPrices) => ({
                        ...prevPrices,
                        [order.id]: amountInSatang,
                    }));
                }
            } else {
                // No coupon code: clear error and remove any discounted price
                setCouponError((prevErrors) => ({
                    ...prevErrors,
                    [order.id]: "",
                }));
                setDiscountedPrices((prevPrices) => {
                    const newPrices = { ...prevPrices };
                    delete newPrices[order.id];
                    return newPrices;
                });
            }
        } catch (error) {
            console.error("Error applying coupon:", error);
            setCouponError((prevErrors) => ({
                ...prevErrors,
                [order.id]: "Error applying coupon",
            }));
        }
    };

    const handleStripePayment = async (order: Order) => {
        try {
            const originalPrice = Math.round(Number(order.total_price) * 100);
            const couponCode = couponCodes[order.id]?.trim();
            // Use discounted price only if a coupon code was used and discount exists,
            // otherwise use the original price.
            const amountToCharge =
                couponCode && discountedPrices[order.id] !== undefined
                    ? discountedPrices[order.id]
                    : originalPrice;

            // Build payload using the defined type.
            const payload: StripePaymentPayload = {
                orderId: order.id,
                amount: amountToCharge,
                currency: "thb",
                ...(couponCode ? { couponCode } : {}),
            };

            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
                                        {discountedPrices[order.id] !==
                                            undefined &&
                                            !couponError[order.id] && (
                                                <div className="flex items-center font-bold text-green-500">
                                                    <DollarSign className="mr-2 h-4 w-4" />
                                                    <span>
                                                        {Number(
                                                            discountedPrices[
                                                                order.id
                                                            ] / 100
                                                        ).toFixed(2)}{" "}
                                                        THB (Discounted)
                                                    </span>
                                                </div>
                                            )}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-2">
                                    {/* Coupon Input and Apply Button */}
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="text"
                                            placeholder="Coupon Code"
                                            value={couponCodes[order.id] || ""}
                                            onChange={(e) =>
                                                setCouponCodes((prev) => ({
                                                    ...prev,
                                                    [order.id]: e.target.value,
                                                }))
                                            }
                                            className="w-full"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                handleApplyCoupon(order)
                                            }
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                    {/* Display Coupon Error */}
                                    {couponError[order.id] && (
                                        <p className="text-red-500 text-sm">
                                            {couponError[order.id]}
                                        </p>
                                    )}
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
                                                updateStatus(order.id, "paid")
                                            }
                                        >
                                            Mark as Paid
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() =>
                                                updateStatus(
                                                    order.id,
                                                    "cancelled"
                                                )
                                            }
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
