"use client";

import { useState, useEffect, useRef } from "react";
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
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const errorRef = useRef<HTMLDivElement>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.07;
    const total = subtotal + tax;

    const handlePlaceOrder = async () => {
        if (items.length === 0) {
            setErrorMessage("Cart is empty. Please add items before placing an order.");
            return;
        }

        const parsedNumberOfCustomers = Number(numberOfCustomers);
        if (isNaN(parsedNumberOfCustomers) || parsedNumberOfCustomers < 1) {
            setErrorMessage("Please enter a valid number of customers (at least 1).");
            return;
        }
        if (!selectedTable) {
            setErrorMessage("Please select a table number.");
            return;
        }

        const orderData = {
            tableNumber: selectedTable,
            numberOfCustomers: parsedNumberOfCustomers.toString(),
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
            setErrorMessage(null); // Clear previous errors
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.error || "Failed to place order. Please try again.");
            } else {
                onPlaceOrder(); // Clear cart on success
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2500);
            }
        } catch (error) {
            console.error("Error placing order:", error);
            setErrorMessage("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Focus error banner when error appears
    useEffect(() => {
        if (errorMessage && errorRef.current) {
            errorRef.current.focus();
        }
    }, [errorMessage]);

    const formatCurrency = (amount: number) => amount.toLocaleString("th-TH", { style: "currency", currency: "THB" });

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b">
                <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>

                {errorMessage && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                        tabIndex={-1}
                        ref={errorRef}
                        aria-live="assertive"
                    >
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{errorMessage}</span>
                    </div>
                )}
                {showSuccess && (
                    <div
                        className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
                        role="status"
                        aria-live="polite"
                    >
                        <strong className="font-bold">Order placed!</strong>
                        <span className="block sm:inline ml-2">Your order was submitted successfully.</span>
                    </div>
                )}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="table-select">
                            Table Number
                        </label>
                        <Select
                            value={selectedTable}
                            onValueChange={setSelectedTable}
                            aria-label="Select table number"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select table" />
                            </SelectTrigger>
                            <SelectContent>
                                {[...Array(10)].map((_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()} aria-label={`Table ${i + 1}`}>
                                        Table {i + 1}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="num-customers">
                            Number of Customers
                        </label>
                        <Input
                            id="num-customers"
                            type="number"
                            min={1}
                            value={numberOfCustomers}
                            onChange={(e) => setNumberOfCustomers(e.target.value)}
                            aria-label="Number of customers"
                        />
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                {items.map((item) => (
                    <div
                        key={item.productId}
                        className="flex items-center gap-4 mb-4"
                        tabIndex={0}
                        aria-label={`Cart item: ${item.name}`}
                    >
                        <div className="relative w-16 h-16 rounded overflow-hidden">
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
                                {formatCurrency(Number(item.price))}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onDecrement(item.productId)}
                                aria-label={`Decrease quantity of ${item.name}`}
                                disabled={loading}
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
                                aria-label={`Increase quantity of ${item.name}`}
                                disabled={loading}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => onRemove(item.productId)}
                                aria-label={`Remove ${item.name} from order`}
                                disabled={loading}
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
            </ScrollArea>

            <div className="p-6 border-t bg-gray-50 dark:bg-gray-800">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Tax (7%)</span>
                        <span>{formatCurrency(tax)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>

                <Button
                    className="w-full h-12 text-lg"
                    onClick={handlePlaceOrder}
                    disabled={loading || items.length === 0}
                    aria-label="Place order"
                >
                    {loading ? "Processing..." : "Place Order"}
                </Button>
            </div>
        </div>
    );
}
