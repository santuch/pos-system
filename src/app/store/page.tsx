"use client";

import React, { useEffect, useState } from "react";
import SideNav from "@/components/SideNav";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Users, BarChart } from "lucide-react";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Card } from "@/components/ui/card";

// ---------- Type definitions ----------
type Order = {
    id: number;
    table_number: string;
    number_of_customers: number;
    total_price: number | string;
    payment_method?: string;
    created_at: string;
    status: string;
};

type DailySales = {
    date: string;
    totalSales: number;
};

type TopItem = {
    name: string;
    totalQuantity: number;
    totalRevenue: number;
};

type AnalyticsData = {
    orders: Order[];
    dailySales: DailySales[];
    salesHistory: Order[];
    totalCustomers: number;
    topItems: TopItem[];
    previousPeriod?: {
        totalSales: number;
        totalOrders: number;
    };
    error?: string;
};

// ---------- Helper Function ----------
function parsePrice(val: number | string): number {
    const num = parseFloat(String(val));
    return isNaN(num) ? 0 : num;
}

export default function StoreDashboard() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [range, setRange] = useState<"day" | "week" | "month">("day");

    useEffect(() => {
        fetchAnalytics(range);
    }, [range]);

    const fetchAnalytics = async (selectedRange: string) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/store-analytics?range=${selectedRange}`
            );
            const data = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error("Error fetching analytics:", error);
            setAnalytics({
                error: "Failed to fetch analytics",
            } as AnalyticsData);
        } finally {
            setLoading(false);
        }
    };

    // ---------- Derived Metrics ----------
    const totalOrders = analytics?.orders?.length || 0;
    const totalSales = analytics?.orders
        ? analytics.orders.reduce(
              (acc, order) => acc + parsePrice(order.total_price),
              0
          )
        : 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalCustomers = analytics?.totalCustomers || 0;
    const avgValuePerCustomer =
        totalCustomers > 0 ? totalSales / totalCustomers : 0;

    // ---------- Export Functions ----------
    const exportPDF = () => {
        if (!analytics?.salesHistory || analytics.salesHistory.length === 0) {
            alert("No sales history to export.");
            return;
        }
        const doc = new jsPDF();
        doc.text("Sales History", 14, 16);
        const tableColumn = [
            "Date",
            "Order ID",
            "Table",
            "Customers",
            "Payment Method",
            "Total (THB)",
            "Status",
        ];
        const tableRows = analytics.salesHistory.map((order) => [
            new Date(order.created_at).toLocaleDateString(),
            order.id,
            order.table_number,
            order.number_of_customers,
            order.payment_method || "N/A",
            parsePrice(order.total_price).toFixed(2),
            order.status,
        ]);
        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });
        doc.save("sales_history.pdf");
    };

    const exportCSV = () => {
        if (!analytics?.salesHistory || analytics.salesHistory.length === 0) {
            alert("No sales history to export.");
            return;
        }
        const headers = [
            "Date",
            "Order ID",
            "Table",
            "Customers",
            "Payment Method",
            "Total (THB)",
            "Status",
        ];
        const rows = analytics.salesHistory.map((order) => [
            new Date(order.created_at).toLocaleDateString(),
            String(order.id),
            order.table_number,
            String(order.number_of_customers),
            order.payment_method || "N/A",
            parsePrice(order.total_price).toFixed(2),
            order.status,
        ]);
        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers, ...rows].map((e) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sales_history.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ---------- Daily Sales Chart Component ----------
    const DailySalesChart = ({ data }: { data: DailySales[] }) => (
        <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalSales" stroke="#8884d8" />
            </LineChart>
        </ResponsiveContainer>
    );

    return (
        <div className="flex h-screen bg-gray-50">
            <SideNav />
            <main className="flex-1 overflow-y-auto p-6">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Store Dashboard
                    </h1>
                    <p className="mt-2 text-gray-600">
                        A comprehensive overview of your store's performance.
                    </p>
                </header>

                {/* Range Tabs */}
                <div className="flex space-x-4 mb-6">
                    {["day", "week", "month"].map((r) => (
                        <button
                            key={r}
                            onClick={() =>
                                setRange(r as "day" | "week" | "month")
                            }
                            className={`px-4 py-2 border rounded ${
                                range === r
                                    ? "bg-gray-900 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading data...</p>
                ) : analytics && "error" in analytics ? (
                    <p className="text-red-500">Error: {analytics.error}</p>
                ) : (
                    <>
                        {/* Metrics Section */}
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                            <div className="border rounded p-4 text-center">
                                <div className="flex justify-center mb-2 text-gray-600">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <p className="text-sm text-gray-500">
                                    Total Orders
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {totalOrders}
                                </p>
                            </div>
                            <div className="border rounded p-4 text-center">
                                <div className="flex justify-center mb-2 text-gray-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <p className="text-sm text-gray-500">
                                    Total Sales
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {totalSales.toFixed(2)} THB
                                </p>
                            </div>
                            <div className="border rounded p-4 text-center">
                                <div className="flex justify-center mb-2 text-gray-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <p className="text-sm text-gray-500">
                                    Avg. Order Value
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {averageOrderValue.toFixed(2)} THB
                                </p>
                            </div>
                            <div className="border rounded p-4 text-center">
                                <div className="flex justify-center mb-2 text-gray-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                <p className="text-sm text-gray-500">
                                    Total Customers
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {totalCustomers}
                                </p>
                            </div>
                            <div className="border rounded p-4 text-center">
                                <div className="flex justify-center mb-2 text-gray-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <p className="text-sm text-gray-500">
                                    Avg. Value per Customer
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {avgValuePerCustomer.toFixed(2)} THB
                                </p>
                            </div>
                        </section>

                        {/* Best Seller Items Section */}
                        <section className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Best Seller Items
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {analytics?.topItems &&
                                analytics.topItems.length > 0 ? (
                                    analytics.topItems.map((item) => (
                                        <div
                                            key={item.name}
                                            className="border rounded p-4"
                                        >
                                            <h3 className="text-md font-semibold">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Total Quantity:{" "}
                                                {item.totalQuantity}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Total Revenue:{" "}
                                                {item.totalRevenue.toFixed(2)}{" "}
                                                THB
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">
                                        No best seller items available.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Daily Sales Chart Section */}
                        <section className="mb-8">
                            <Card className="shadow-lg rounded-lg">
                                <div className="p-4 border-b flex items-center gap-2">
                                    <BarChart className="h-5 w-5 text-blue-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Daily Sales
                                    </h2>
                                </div>
                                <div className="p-4 flex justify-center">
                                    {analytics?.dailySales?.length ? (
                                        <DailySalesChart
                                            data={analytics.dailySales}
                                        />
                                    ) : (
                                        <p className="text-gray-500">
                                            No daily sales data.
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </section>

                        {/* Sales History Section */}
                        <section className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Sales History
                                </h2>
                                <div className="space-x-2">
                                    <Button
                                        onClick={exportCSV}
                                        className="bg-white text-gray-700 border hover:bg-gray-100"
                                    >
                                        CSV
                                    </Button>
                                    <Button
                                        onClick={exportPDF}
                                        className="bg-white text-gray-700 border hover:bg-gray-100"
                                    >
                                        PDF
                                    </Button>
                                </div>
                            </div>
                            <div className="border rounded">
                                <table className="w-full text-sm text-gray-700">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="py-2 px-4 text-left">
                                                Order ID
                                            </th>
                                            <th className="py-2 px-4 text-left">
                                                Date
                                            </th>
                                            <th className="py-2 px-4 text-left">
                                                Table
                                            </th>
                                            <th className="py-2 px-4 text-left">
                                                Customers
                                            </th>
                                            <th className="py-2 px-4 text-left">
                                                Payment Method
                                            </th>
                                            <th className="py-2 px-4 text-left">
                                                Total (THB)
                                            </th>
                                            <th className="py-2 px-4 text-left">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!analytics?.salesHistory?.length ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="py-4 px-4 text-center text-gray-500"
                                                >
                                                    No results.
                                                </td>
                                            </tr>
                                        ) : (
                                            analytics.salesHistory.map(
                                                (order) => (
                                                    <tr
                                                        key={order.id}
                                                        className="border-b hover:bg-gray-50"
                                                    >
                                                        <td className="py-2 px-4">
                                                            {order.id}
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            {new Date(
                                                                order.created_at
                                                            ).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            {order.table_number}
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            {
                                                                order.number_of_customers
                                                            }
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            {order.payment_method ||
                                                                "N/A"}
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            {parsePrice(
                                                                order.total_price
                                                            ).toFixed(2)}
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            {order.status}
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Refresh Button */}
                        <div className="flex justify-end">
                            <Button
                                onClick={() => fetchAnalytics(range)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
                            >
                                Refresh
                            </Button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
