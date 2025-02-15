"use client";

import React, { useEffect, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import OrderSummary from "@/components/OrderSummary";
import CategoryTabs from "@/components/CategoryTabs";
import SideNav from "@/components/SideNav";

type CartItem = {
    productId: number;
    name: string;
    price: number;
    image_url: string;
    quantity: number;
};

export default function PosPage() {
    const [activeCategory, setActiveCategory] = useState("all");
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedTable, setSelectedTable] = useState("Table 1");
    const [numberOfCustomers, setNumberOfCustomers] = useState("1");

    const handleAddToOrder = (product: CartItem) => {
        setCartItems((prev) => {
            const existing = prev.find(
                (item) => item.productId === product.productId
            );
            if (existing) {
                return prev.map((item) =>
                    item.productId === product.productId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, product];
        });
    };

    const handleIncrement = (productId: number) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };

    const handleDecrement = (productId: number) => {
        setCartItems((prev) =>
            prev
                .map((item) =>
                    item.productId === productId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const handleRemove = (productId: number) => {
        setCartItems((prev) =>
            prev.filter((item) => item.productId !== productId)
        );
    };

    return (
        <div className="flex h-screen">
            <SideNav />
            <div className="flex-1 flex flex-col">
                <div className="border-b p-4">
                    <CategoryTabs
                        activeCategory={activeCategory}
                        onChange={setActiveCategory}
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <ProductGrid
                        activeCategory={activeCategory}
                        onAddToOrder={handleAddToOrder}
                    />
                </div>
            </div>
            <div className="w-96 border-l bg-gray-50 p-4">
                <OrderSummary
                    items={cartItems}
                    selectedTable={selectedTable}
                    setSelectedTable={setSelectedTable}
                    numberOfCustomers={numberOfCustomers}
                    setNumberOfCustomers={setNumberOfCustomers}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    onRemove={handleRemove}
                    onPlaceOrder={() => setCartItems([])}
                />
            </div>
        </div>
    );
}
