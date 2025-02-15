"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    UtensilsCrossed,
    Truck,
    Receipt,
    Settings,
    PlusCircle,
} from "lucide-react";

const menuItems = [
    { id: "menu", name: "Menu", href: "/pos", icon: Home },
    {
        id: "menu-management",
        name: "MenuManagement",
        href: "/MenuManagement",
        icon: PlusCircle,
    },
    {
        id: "table-services",
        name: "Table Services",
        href: "/table-services",
        icon: UtensilsCrossed,
    },
    {
        id: "ingredient-management",
        name: "IngredientManagement",
        href: "/ingredient-management",
        icon: Truck,
    },
    {
        id: "cooker-dashboard",
        name: "Cooker Dashboard",
        href: "/order-dashboard/cooker",
        icon: Receipt,
    },
    {
        id: "payment-dashboard",
        name: "Payment Dashboard",
        href: "/order-dashboard/payment",
        icon: Receipt,
    },
    { id: "settings", name: "Settings", href: "/settings", icon: Settings },
];

export default function SideNav() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r h-screen p-4">
            <h2 className="text-xl font-bold mb-4">POS</h2>
            <nav className="space-y-2">
                {menuItems.map((item) => (
                    <Link key={item.id} href={item.href}>
                        <div
                            className={cn(
                                "flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-gray-100",
                                pathname === item.href
                                    ? "bg-gray-200 font-semibold"
                                    : ""
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </div>
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
