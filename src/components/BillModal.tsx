"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2 } from "lucide-react";

// Type for individual items within an order fetched from the API
type OrderItem = {
    id: number;
    name: string;
    price: number; // price_at_order
    quantity: number;
};

// Type for the detailed order data fetched from the API
type OrderDetails = {
    id: number;
    table_number: string;
    number_of_customers: number;
    total_price: number | string; // API might return string
    status: string;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
};

// Type for the calculated values we'll display
type CalculatedBill = {
    items: OrderItem[];
    subtotal: number;
    taxAmount: number;
    total: number;
};

type BillModalProps = {
    orderId: number | null;
    isOpen: boolean;
    onClose: () => void;
};

// Helper to safely parse price which might be string or number
function parsePrice(val: number | string | undefined): number {
    if (val === undefined || val === null) return 0;
    const num = parseFloat(String(val));
    return isNaN(num) ? 0 : num;
}

export default function BillModal({
    orderId,
    isOpen,
    onClose,
}: BillModalProps) {
    const [billDetails, setBillDetails] = useState<CalculatedBill | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && orderId !== null) {
            const fetchOrderDetails = async () => {
                setLoading(true);
                setError(null);
                setBillDetails(null); // Clear previous details
                try {
                    const response = await fetch(`/api/orders/${orderId}`);
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(
                            errorData.error ||
                                `Failed to fetch order details (Status: ${response.status})`
                        );
                    }
                    const data: OrderDetails = await response.json();

                    // Calculate subtotal and tax (assuming 5% tax included in total_price)
                    const total = parsePrice(data.total_price);
                    const taxRate = 0.05;
                    const subtotal = total / (1 + taxRate);
                    const taxAmount = total - subtotal;

                    setBillDetails({
                        items: data.items || [], // Ensure items is always an array
                        subtotal: subtotal,
                        taxAmount: taxAmount,
                        total: total,
                    });
                } catch (err: any) {
                    console.error("Error fetching bill details:", err);
                    setError(
                        err.message || "An unexpected error occurred fetching the bill."
                    );
                } finally {
                    setLoading(false);
                }
            };

            fetchOrderDetails();
        } else {
            // Reset state if modal is closed or orderId is null
            setBillDetails(null);
            setLoading(false);
            setError(null);
        }
    }, [isOpen, orderId]); // Rerun effect when isOpen or orderId changes

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose(); // Call the onClose callback when the dialog is closed
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Bill for Order #{orderId ?? "N/A"}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {loading && (
                        <div className="flex justify-center items-center min-h-[200px]">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                            <span className="ml-2">Loading Bill...</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex flex-col justify-center items-center min-h-[200px] text-red-600">
                            <AlertCircle className="h-8 w-8 mb-2" />
                            <p className="font-semibold">Error loading bill</p>
                            <p className="text-sm text-center mt-1">{error}</p>
                        </div>
                    )}
                    {billDetails && !loading && !error && (
                        <div className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-center">Qty</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {billDetails.items.length > 0 ? (
                                        billDetails.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.quantity}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {parsePrice(item.price).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {(
                                                        parsePrice(item.price) * item.quantity
                                                    ).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="text-center text-gray-500 py-4"
                                            >
                                                No items found for this order.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <Separator />
                            <div className="space-y-1 text-sm pr-2">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{billDetails.subtotal.toFixed(2)} THB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax (5%)</span>
                                    <span>{billDetails.taxAmount.toFixed(2)} THB</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-semibold text-base">
                                    <span>Total</span>
                                    <span>{billDetails.total.toFixed(2)} THB</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}