"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLowStockWarning, LowStockIngredient } from "@/lib/hooks";
import { useState } from "react";
import {
    Home,
    UtensilsCrossed,
    Truck,
    Receipt,
    PlusCircle,
    Store,
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
        id: "ingredient-management",
        name: "IngredientManagement",
        href: "/ingredient-management",
        icon: Truck,
    },
    {
        id: "cooker-dashboard",
        name: "Cooker Dashboard",
        href: "/order-dashboard/cooker",
        icon: UtensilsCrossed,
    },
    {
        id: "payment-dashboard",
        name: "Payment Dashboard",
        href: "/order-dashboard/payment",
        icon: Receipt,
    },
    { id: "store", name: "store", href: "/store", icon: Store },
];

export default function SideNav() {
    const pathname = usePathname();
    const { items: lowStockItems, loading: lowStockLoading, error: lowStockError } = useLowStockWarning();
    const [dismissed, setDismissed] = useState(false);

    const getSeverityLabel = (severity: string) => severity === 'critical' ? 'Critical' : 'Low';
    const getSeverityColor = (severity: string) => severity === 'critical' ? 'bg-red-600 text-white' : 'bg-yellow-400 text-black';

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
            {/* Low Stock Notification */}
            {!dismissed && (
                <div className="relative mt-4">
                    {lowStockLoading && (
                        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded flex items-center" role="status" aria-live="polite">
                            <span className="loader mr-2" aria-label="Loading" /> Checking stock levels...
                        </div>
                    )}
                    {lowStockError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center" role="alert" aria-live="assertive">
                            <span className="font-bold mr-2">Stock Error:</span> {lowStockError}
                        </div>
                    )}
                    {!lowStockLoading && !lowStockError && lowStockItems.length > 0 && (
                        <div
                            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                            role="alert"
                            aria-live="assertive"
                        >
                            <button
                                onClick={() => setDismissed(true)}
                                className="absolute top-2 right-2 text-red-700 hover:text-red-900"
                                aria-label="Dismiss low stock notification"
                            >
                                ×
                            </button>
                            <strong className="font-bold">Low Stock Alert!</strong>
                            <ul className="mt-2 ml-2 space-y-1">
                                {lowStockItems.map((item: LowStockIngredient) => (
                                    <li key={item.name} className="flex items-center space-x-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(item.severity)}`}>{getSeverityLabel(item.severity)}</span>
                                        <span>{item.name}:</span>
                                        <span>{item.quantity} / {item.threshold}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/ingredient-management" className="inline-block mt-3 text-blue-700 underline font-medium hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded">
                                View Details
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
}
