"use client";

import { useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import OrderSummary from "@/components/OrderSummary";
import CategoryTabs from "@/components/CategoryTabs";
import SideNav from "@/components/SideNav";
import { ScrollArea } from "@/components/ui/scroll-area";

type CartItem = {
    productId: number;
    name: string;
    price: number;
    image_url: string;
    quantity: number;
};

export default function PosPage() {
    const [activeCategory, setActiveCategory] = useState("All");
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
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <SideNav />
            <div className="flex-1 flex flex-col">
                <div className="bg-white dark:bg-gray-800 border-b p-4 shadow-sm">
                    <CategoryTabs
                        activeCategory={activeCategory}
                        onChange={setActiveCategory}
                    />
                </div>
                <ScrollArea className="flex-1">
                    <ProductGrid
                        activeCategory={activeCategory}
                        onAddToOrder={handleAddToOrder}
                    />
                </ScrollArea>
            </div>
            <div className="w-[400px] border-l bg-white dark:bg-gray-800 shadow-lg">
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
