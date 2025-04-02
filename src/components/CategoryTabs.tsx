"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = [
    { id: "All", label: "All", icon: "🏠" },
    { id: "Main Dish", label: "Main Dish", icon: "🍽️" },
    { id: "Drinks", label: "Drinks", icon: "🥤" },
    { id: "Desserts", label: "Desserts", icon: "🍰" },
];

type Props = {
    activeCategory: string;
    onChange: (cat: string) => void;
};

export default function CategoryTabs({ activeCategory, onChange }: Props) {
    return (
        <Tabs
            value={activeCategory}
            onValueChange={onChange}
            className="w-full"
        >
            <TabsList className="flex flex-wrap h-auto gap-2 bg-gray-100/80 dark:bg-gray-800/80 p-2 rounded-lg">
                {categories.map((cat) => (
                    <TabsTrigger
                        key={cat.id}
                        value={cat.id}
                        className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    >
                        <span>{cat.icon}</span>
                        {cat.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
