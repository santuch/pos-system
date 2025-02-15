"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type CartItem = {
    productId: number;
    name: string;
    price: number;
    image_url: string;
    quantity: number;
};

type OrderSummaryProps = {
    items: CartItem[];
    selectedTable: string;
    setSelectedTable: (value: string) => void;
    numberOfCustomers: string;
    setNumberOfCustomers: (value: string) => void;
    onIncrement: (productId: number) => void;
    onDecrement: (productId: number) => void;
    onRemove: (productId: number) => void;
    onPlaceOrder: () => void;
};

export default function OrderSummary({
    items,
    selectedTable,
    setSelectedTable,
    numberOfCustomers,
    setNumberOfCustomers,
    onIncrement,
    onDecrement,
    onRemove,
    onPlaceOrder,
}: OrderSummaryProps) {
    const [loading, setLoading] = useState(false);

    // Calculate totals
    const subtotal = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    // Place Order Function
    const handlePlaceOrder = async () => {
        if (items.length === 0) {
            alert("Cart is empty. Please add items before placing an order.");
            return;
        }

        const orderData = {
            tableNumber: selectedTable,
            numberOfCustomers: numberOfCustomers || "0",
            items: items.map((item) => ({
                id: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
            })),
            totalPrice: total,
        };

        console.log("📢 Sending Order:", orderData);

        try {
            setLoading(true);
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("❌ Failed to place order:", errorData);
                alert("Failed to place order. Please try again.");
                return;
            }

            const result = await response.json();
            console.log("✅ Order Placed Successfully:", result);
            alert("Order placed successfully!");
            onPlaceOrder(); // Clear cart after successful order
        } catch (error) {
            console.error("🚨 Error placing order:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border-l bg-white h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            {/* Table Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                    Select Table:
                </label>
                <select
                    className="w-full p-2 border rounded-md"
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                >
                    <option value="Table 1">Table 1</option>
                    <option value="Table 2">Table 2</option>
                    <option value="Table 3">Table 3</option>
                    <option value="Table 4">Table 4</option>
                </select>
            </div>

            {/* Number of Customers */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                    Number of Customers:
                </label>
                <Input
                    type="number"
                    placeholder="Enter number of customers..."
                    value={numberOfCustomers}
                    onChange={(e) => setNumberOfCustomers(e.target.value)}
                />
            </div>

            <Separator className="my-2" />

            {/* Order Items */}
            <div className="space-y-4 flex-1 overflow-y-auto">
                {items.length > 0 ? (
                    items.map((item) => (
                        <div
                            key={item.productId}
                            className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                        >
                            {/* Item Image */}
                            <div className="w-16 h-16 flex-shrink-0">
                                <Image
                                    src={item.image_url}
                                    alt={item.name}
                                    width={64}
                                    height={64}
                                    className="rounded-md object-cover"
                                />
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 px-3">
                                <p className="font-medium text-sm">
                                    {item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    ${item.price.toFixed(2)}
                                </p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                        item.quantity === 1
                                            ? onRemove(item.productId)
                                            : onDecrement(item.productId)
                                    }
                                >
                                    -
                                </Button>
                                <span className="w-6 text-center">
                                    {item.quantity}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onIncrement(item.productId)}
                                >
                                    +
                                </Button>
                            </div>

                            {/* Remove Button */}
                            <Button
                                variant="destructive"
                                size="sm"
                                className="ml-2 h-8 px-2"
                                onClick={() => onRemove(item.productId)}
                            >
                                ✕
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500">
                        No items in the order.
                    </p>
                )}
            </div>

            <Separator className="my-4" />

            {/* Total Calculation */}
            <div className="text-sm space-y-2">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax (5%):</span>
                    <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>

            <Separator className="my-4" />

            <Button
                className="w-full mt-4 bg-green-500 hover:bg-green-600"
                onClick={handlePlaceOrder}
                disabled={loading}
            >
                {loading ? "Placing Order..." : "Place Order"}
            </Button>
        </div>
    );
}
