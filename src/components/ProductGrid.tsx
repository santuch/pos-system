"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

type Product = {
    id: number;
    name: string;
    category: string;
    price: number;
    description: string;
    image_url: string;
};

type ProductGridProps = {
    activeCategory: string;
    onAddToOrder: (product: {
        productId: number;
        name: string;
        price: number;
        image_url: string;
        quantity: number;
    }) => void;
};

export default function ProductGrid({
    activeCategory,
    onAddToOrder,
}: ProductGridProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch("/api/menus");
                if (!res.ok) throw new Error("Failed to fetch products");
                const data = await res.json();
                setProducts(data);
            } catch {
                setError("Error fetching products. Please try again later.");
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    let filteredProducts =
        activeCategory === "All"
            ? products
            : products.filter((p) => p.category === activeCategory);

    if (searchTerm.trim()) {
        filteredProducts = filteredProducts.filter((p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 relative">
                <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-50"
                    aria-label="Search products"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" aria-label="Search icon"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                {searchTerm && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1.5"
                        onClick={() => setSearchTerm("")}
                        aria-label="Clear search"
                    >
                        Clear
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="animate-pulse bg-gray-200 rounded-lg h-60" aria-hidden="true"></div>
                    ))}
                </div>
            ) : error ? (
                <div className="flex items-center justify-center h-64">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert" aria-live="assertive">
                        <strong className="font-bold">Error:</strong> {error}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                        <Card
                            key={product.id}
                            className="bg-white overflow-hidden flex flex-col h-full"
                            tabIndex={0}
                            aria-label={`Product: ${product.name}`}
                        >
                            <div className="relative w-full pt-[75%]">
                                <Image
                                    src={
                                        product.image_url || "/placeholder.svg"
                                    }
                                    alt={product.name}
                                    fill
                                    className="object-cover absolute top-0 left-0"
                                    priority
                                />
                            </div>
                            <div className="p-4">
                                <h1 className="text-lg font-medium mb-2">
                                    {product.name}
                                </h1>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xl font-semibold text-green-500">
                                        {product.price.toLocaleString("th-TH", { style: "currency", currency: "THB" })}
                                    </span>
                                    <Button
                                        className="bg-black text-white hover:bg-gray-800"
                                        onClick={() =>
                                            onAddToOrder({
                                                productId: product.id,
                                                name: product.name,
                                                price: product.price,
                                                image_url: product.image_url,
                                                quantity: 1,
                                            })
                                        }
                                        aria-label={`Add ${product.name} to order`}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add to Order
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {filteredProducts.length === 0 && !loading && !error && (
                <div className="text-center text-gray-500 mt-12">
                    <p className="text-lg">No products found</p>
                    <p className="text-sm">
                        Try adjusting your search or category
                    </p>
                </div>
            )}
        </div>
    );
}
