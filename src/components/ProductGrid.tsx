"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

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

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch("/api/menus");
                if (!res.ok) throw new Error("Failed to fetch products");
                const data = await res.json();
                setProducts(data);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    let filteredProducts =
        activeCategory === "all"
            ? products
            : products.filter((p) => p.category === activeCategory);

    if (searchTerm.trim()) {
        filteredProducts = filteredProducts.filter((p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    return (
        <div className="p-4">
            <div className="mb-4 flex items-center space-x-2">
                <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <Button variant="ghost" onClick={() => setSearchTerm("")}>
                        Clear
                    </Button>
                )}
            </div>

            {loading ? (
                <p className="text-center text-gray-500">Loading products...</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="border rounded-lg p-2 flex flex-col items-center"
                        >
                            <Image
                                src={product.image_url}
                                alt={product.name}
                                width={100}
                                height={100}
                                unoptimized
                                className="object-contain rounded-md"
                            />

                            <div className="mt-2 text-center">
                                <h3 className="font-semibold">
                                    {product.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    ${product.price.toFixed(2)}
                                </p>
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="mt-2 text-sm"
                                    >
                                        Details
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 text-sm">
                                    {product.description}
                                </PopoverContent>
                            </Popover>

                            <Button
                                className="mt-auto w-full"
                                onClick={() =>
                                    onAddToOrder({
                                        productId: product.id,
                                        name: product.name,
                                        price: product.price,
                                        image_url: product.image_url,
                                        quantity: 1, // 🔹 Fix: Ensure quantity is included
                                    })
                                }
                            >
                                Add to Order
                            </Button>
                        </div>
                    ))}

                    {filteredProducts.length === 0 && !loading && (
                        <p className="col-span-full text-center text-gray-500">
                            No products found.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
