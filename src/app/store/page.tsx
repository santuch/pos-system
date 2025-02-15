"use client";

import React, { useEffect, useState } from "react";
import SideNav from "@/components/SideNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, BarChart } from "lucide-react";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Type definitions for your data
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

type AnalyticsData = {
    orders: Order[];
    dailySales: DailySales[];
    // If you have a topItems array, you can define it similarly
    salesHistory: Order[];
    totalCustomers: number;
    // Optionally, previousPeriod for comparisons
    previousPeriod?: {
        totalSales: number;
        totalOrders: number;
    };
};

// Helper function: safely parse numeric values
function parsePrice(val: number | string): number {
    const num = parseFloat(String(val));
    return isNaN(num) ? 0 : num;
}

export default function StoreDashboard() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // For demonstration, we fetch a fixed range "day".
    // You can add range state and UI if you want day/week/month/year selection.
    useEffect(() => {
        fetchAnalytics("day");
    }, []);

    const fetchAnalytics = async (range: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/store-analytics?range=${range}`);
            const data = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    // Derived metrics
    const totalOrders = analytics?.orders.length || 0;
    const totalSales = analytics
        ? analytics.orders.reduce(
              (acc, order) => acc + parsePrice(order.total_price),
              0
          )
        : 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalCustomers = analytics?.totalCustomers || 0;
    const avgValuePerCustomer =
        totalCustomers > 0 ? totalSales / totalCustomers : 0;

    // PDF Export
    const exportPDF = () => {
        if (!analytics) return;
        const { salesHistory } = analytics;
        if (!salesHistory || salesHistory.length === 0) {
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
        ];
        const tableRows = salesHistory.map((order) => [
            new Date(order.created_at).toLocaleDateString(),
            order.id,
            order.table_number,
            order.number_of_customers,
            order.payment_method || "N/A",
            parsePrice(order.total_price).toFixed(2),
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("sales_history.pdf");
    };

    // CSV Export
    const exportCSV = () => {
        if (!analytics) return;
        const { salesHistory } = analytics;
        if (!salesHistory || salesHistory.length === 0) {
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
        ];
        const rows = salesHistory.map((order) => [
            new Date(order.created_at).toLocaleDateString(),
            String(order.id),
            order.table_number,
            String(order.number_of_customers),
            order.payment_method || "N/A",
            parsePrice(order.total_price).toFixed(2),
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

    // Recharts line chart for dailySales
    const SalesLineChart = ({ data }: { data: DailySales[] }) => (
        <LineChart width={600} height={300} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="totalSales" stroke="#8884d8" />
        </LineChart>
    );

    return (
        <div className="flex h-screen bg-gray-100">
            <SideNav />
            <div className="flex-1 overflow-y-auto p-8">
                <h1 className="text-3xl font-bold mb-6">Store Dashboard</h1>

                {loading || !analytics ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, idx) => (
                            <Card key={idx}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Example Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card className="shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-blue-500" />
                                        Total Orders
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">
                                        {analytics.orders.length}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-green-500" />
                                        Total Sales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">
                                        {totalSales.toFixed(2)} THB
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-purple-500" />
                                        Avg. Order Value
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">
                                        {averageOrderValue.toFixed(2)} THB
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-orange-500" />
                                        Total Customers
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">
                                        {analytics.totalCustomers}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-red-500" />
                                        Avg. Value per Customer
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">
                                        {avgValuePerCustomer.toFixed(2)} THB
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sales Chart */}
                        <Card className="mb-8 shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart className="h-5 w-5 text-blue-500" />
                                    Daily Sales
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {analytics.dailySales.length > 0 ? (
                                    <SalesLineChart
                                        data={analytics.dailySales}
                                    />
                                ) : (
                                    <p className="text-gray-500">
                                        No daily sales data.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Sales History */}
                        <Card className="shadow">
                            <CardHeader>
                                <CardTitle>Sales History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {analytics.salesHistory.length === 0 ? (
                                    <p className="text-gray-500">
                                        No sales history available.
                                    </p>
                                ) : (
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="px-4 py-2 text-left">
                                                    Date
                                                </th>
                                                <th className="px-4 py-2 text-left">
                                                    Order ID
                                                </th>
                                                <th className="px-4 py-2 text-left">
                                                    Table
                                                </th>
                                                <th className="px-4 py-2 text-right">
                                                    Customers
                                                </th>
                                                <th className="px-4 py-2 text-left">
                                                    Payment Method
                                                </th>
                                                <th className="px-4 py-2 text-right">
                                                    Total (THB)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.salesHistory.map(
                                                (order) => (
                                                    <tr
                                                        key={order.id}
                                                        className="border-b last:border-none"
                                                    >
                                                        <td className="px-4 py-2">
                                                            {new Date(
                                                                order.created_at
                                                            ).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {order.id}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {order.table_number}
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            {
                                                                order.number_of_customers
                                                            }
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {order.payment_method ||
                                                                "N/A"}
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            {parsePrice(
                                                                order.total_price
                                                            ).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </CardContent>
                        </Card>

                        {/* Export Buttons */}
                        <div className="flex gap-4 mt-8">
                            <Button
                                onClick={() => exportCSV()}
                                className="bg-green-500 hover:bg-green-600 text-white"
                            >
                                Export CSV
                            </Button>
                            <Button
                                onClick={() =>
                                    exportPDF()
                                }
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                Export PDF
                            </Button>
                        </div>

                        <div className="mt-8">
                            <Button
                                onClick={() => fetchAnalytics("day")}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                Refresh (Day)
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// CSV Export function that uses local data
function exportCSV(salesHistory: Order[]) {
    if (!salesHistory || salesHistory.length === 0) {
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
    ];
    const rows = salesHistory.map((order) => [
        new Date(order.created_at).toLocaleDateString(),
        String(order.id),
        order.table_number,
        String(order.number_of_customers),
        order.payment_method || "N/A",
        parsePrice(order.total_price).toFixed(2),
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
}

// PDF Export function using jsPDF
function exportPDF(salesHistory: Order[]) {
    if (!salesHistory || salesHistory.length === 0) {
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
    ];
    const tableRows = salesHistory.map((order) => [
        new Date(order.created_at).toLocaleDateString(),
        String(order.id),
        order.table_number,
        String(order.number_of_customers),
        order.payment_method || "N/A",
        parsePrice(order.total_price).toFixed(2),
    ]);
    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });
    doc.save("sales_history.pdf");
}

