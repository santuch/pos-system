"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = [
    { id: "all", name: "All" },
    { id: "breakfast", name: "Breakfast" },
    { id: "soups", name: "Soups" },
    { id: "pasta", name: "Pasta" },
    { id: "main-course", name: "Main Course" },
    { id: "drinks", name: "Drinks" },
    { id: "desserts", name: "Desserts" },
];

type Props = {
    activeCategory: string;
    onChange: (cat: string) => void;
};

export default function CategoryTabs({ activeCategory, onChange }: Props) {
    return (
        <Tabs
            value={activeCategory}
            onValueChange={(val) => onChange(val)}
            className="w-full"
        >
            <TabsList className="flex flex-wrap">
                {categories.map((cat) => (
                    <TabsTrigger key={cat.id} value={cat.id}>
                        {cat.name}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
