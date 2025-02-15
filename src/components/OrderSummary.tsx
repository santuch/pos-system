"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, X } from "lucide-react";

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

    const subtotal = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

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

        try {
            setLoading(true);
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                throw new Error("Failed to place order");
            }

            alert("Order placed successfully!");
            onPlaceOrder();
        } catch (error) {
            console.error("Error placing order:", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b">
                <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Table Number
                        </label>
                        <Select
                            value={selectedTable}
                            onValueChange={setSelectedTable}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a table" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4].map((num) => (
                                    <SelectItem
                                        key={num}
                                        value={`Table ${num}`}
                                    >
                                        Table {num}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Number of Customers
                        </label>
                        <Input
                            type="number"
                            min="1"
                            value={numberOfCustomers}
                            onChange={(e) =>
                                setNumberOfCustomers(e.target.value)
                            }
                        />
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.productId}
                            className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                            <div className="relative h-16 w-16 rounded-md overflow-hidden">
                                <Image
                                    src={item.image_url || "/placeholder.svg"}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">
                                    {item.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    ${Number(item.price).toFixed(2)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onDecrement(item.productId)}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center">
                                    {item.quantity}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onIncrement(item.productId)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                    onClick={() => onRemove(item.productId)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <p className="text-lg">Your order is empty</p>
                            <p className="text-sm">
                                Add items from the menu to get started
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-6 border-t bg-gray-50 dark:bg-gray-800">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Tax (5%)</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

                <Button
                    className="w-full h-12 text-lg"
                    onClick={handlePlaceOrder}
                    disabled={loading || items.length === 0}
                >
                    {loading ? "Processing..." : "Place Order"}
                </Button>
            </div>
        </div>
    );
}
