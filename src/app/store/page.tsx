"use client";

import React, { useEffect, useState } from "react";
import SideNav from "@/components/SideNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, BarChart } from "lucide-react";

// Types for analytics
type Order = {
    id: number;
    table_number: string;
    number_of_customers: number;
    items: any;
    total_price: number | string;
    status: string;
    created_at: string;
    payment_method?: string;
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
    topItems: TopItem[];
    salesHistory: Order[];
    totalCustomers: number;
};

// Helper function to safely format numbers
function formatNumber(val: number | string): string {
    const num = parseFloat(String(val));
    return isNaN(num) ? "0.00" : num.toFixed(2);
}

export default function StoreDashboard() {
    // Date range state
    const [dateRange, setDateRange] = useState<
        "day" | "week" | "month" | "year"
    >("day");
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/store-analytics?range=${dateRange}`);
            const data: AnalyticsData = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate key metrics based on analytics data
    const totalOrders = analytics?.orders.length || 0;
    const totalSales = analytics
        ? analytics.orders.reduce(
              (acc, order) =>
                  acc + parseFloat(String(order.total_price) || "0"),
              0
          )
        : 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalCustomers = analytics?.totalCustomers || 0;
    const avgValuePerCustomer =
        totalCustomers > 0 ? totalSales / totalCustomers : 0;

    // Date Range Buttons UI
    const renderRangeButtons = () => (
        <div className="flex gap-2 mb-6">
            {(["day", "week", "month", "year"] as const).map((range) => (
                <Button
                    key={range}
                    variant={dateRange === range ? "default" : "outline"}
                    onClick={() => setDateRange(range)}
                >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                </Button>
            ))}
        </div>
    );

    // Placeholder Sales Chart Component
    const SalesChartPlaceholder = () => (
        <Card className="p-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-blue-500" />
                    Daily Sales
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-48 bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                    [Line Chart Placeholder]
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex h-screen bg-gray-100">
            <SideNav />
            <div className="flex-1 overflow-y-auto p-8">
                <h1 className="text-3xl font-bold mb-6">Store Dashboard</h1>
                {renderRangeButtons()}
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
                        {/* Key Metrics Cards */}
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
                                        {totalOrders}
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
                                        {formatNumber(totalSales)} THB
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
                                        {formatNumber(averageOrderValue)} THB
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
                                        {totalCustomers}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-red-500" />
                                        Avg. Order Value per Customer
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">
                                        {formatNumber(avgValuePerCustomer)} THB
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sales Chart */}
                        <SalesChartPlaceholder />

                        {/* Top-Selling Items */}
                        <Card className="mt-8 shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                        Top-Selling Items
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {analytics.topItems.length === 0 ? (
                                    <p className="text-gray-500">
                                        No data available.
                                    </p>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="py-2 text-left">
                                                    Item
                                                </th>
                                                <th className="py-2 text-right">
                                                    Qty
                                                </th>
                                                <th className="py-2 text-right">
                                                    Revenue (THB)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.topItems.map(
                                                (item, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="border-b last:border-none"
                                                    >
                                                        <td className="py-1">
                                                            {item.name}
                                                        </td>
                                                        <td className="py-1 text-right">
                                                            {item.totalQuantity}
                                                        </td>
                                                        <td className="py-1 text-right">
                                                            {formatNumber(
                                                                item.totalRevenue
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
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
                                                            {order.payment_method
                                                                ? order.payment_method
                                                                : "N/A"}
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            {parseFloat(
                                                                String(
                                                                    order.total_price
                                                                )
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
                    </>
                )}

                <div className="mt-8">
                    <Button
                        onClick={fetchAnalytics}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        Refresh Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
