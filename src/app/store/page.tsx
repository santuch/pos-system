"use client";

import React, { useEffect, useState, useMemo } from "react";
import SideNav from "@/components/SideNav";
import { Button } from "@/components/ui/button";
import { 
    DollarSign, 
    TrendingUp, 
    Users, 
    BarChart, 
    RefreshCw, 
    Download, 
    ArrowUpRight, 
    ArrowDownRight 
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart as RechartsBarChart,
    Bar,
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
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type Order = {
    id: number;
    table_number: string;
    number_of_customers: number;
    total_price: number | string;
    payment_method?: string;
    paid_at?: string;
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

// Extend jsPDF to include the autoTable method.
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: {
        (options: {
            head: string[][];
            body: (string | number)[][];
            startY: number;
            margin?: { top: number };
            styles?: { fontSize: number };
            headStyles?: { fillColor: number[] };
        }): void;
        previous?: {
            finalY: number;
        };
    };
}

export default function StoreDashboard() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [range, setRange] = useState<"day" | "week" | "month" | "year">("day");
    const [error, setError] = useState<string | null>(null);
    const [exportLoading, setExportLoading] = useState<boolean>(false);
    const [chartType, setChartType] = useState<"line" | "bar">("line");
    const [topItemsMode, setTopItemsMode] = useState<"quantity" | "revenue">("quantity");

    useEffect(() => {
        fetchAnalytics(range);
    }, [range]);

    const fetchAnalytics = async (selectedRange: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/store-analytics?range=${selectedRange}`
            );
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            if (data.error) {
                throw new Error(data.error);
            }
            setAnalytics(data);
        } catch (error) {
            console.error("Error fetching analytics:", error);
            setError(typeof error === 'object' && error !== null && 'message' in error 
                ? String(error.message) 
                : "Failed to fetch analytics");
            setAnalytics(null);
        } finally {
            setLoading(false);
        }
    };

    // ---------- Derived Metrics ----------
    const derivedMetrics = useMemo(() => {
        if (!analytics) return {
            totalOrders: 0,
            totalSales: 0,
            averageOrderValue: 0,
            totalCustomers: 0,
            avgValuePerCustomer: 0,
            salesGrowth: 0,
            ordersGrowth: 0
        };

        const totalOrders = analytics.orders?.length || 0;
        const totalSales = analytics.orders
            ? analytics.orders.reduce(
                (acc, order) => acc + parsePrice(order.total_price),
                0
            )
            : 0;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        const totalCustomers = analytics.totalCustomers || 0;
        const avgValuePerCustomer = totalCustomers > 0 ? totalSales / totalCustomers : 0;
        
        // Calculate growth percentages
        const previousSales = analytics.previousPeriod?.totalSales || 0;
        const previousOrders = analytics.previousPeriod?.totalOrders || 0;
        
        const salesGrowth = previousSales > 0 
            ? ((totalSales - previousSales) / previousSales) * 100 
            : 0;
        
        const ordersGrowth = previousOrders > 0 
            ? ((totalOrders - previousOrders) / previousOrders) * 100 
            : 0;
            
        return {
            totalOrders,
            totalSales,
            averageOrderValue,
            totalCustomers,
            avgValuePerCustomer,
            salesGrowth,
            ordersGrowth
        };
    }, [analytics]);

    // ---------- Export Functions ----------
    const exportPDF = () => {
        if (!analytics?.salesHistory || analytics.salesHistory.length === 0) {
            alert("No sales history to export.");
            return;
        }
        
        setExportLoading(true);
        try {
            const doc = new jsPDF() as jsPDFWithAutoTable;
            
            // Add title and date range
            doc.text("Sales History Report", 14, 16);
            doc.setFontSize(10);
            doc.text(`Date Range: ${range.charAt(0).toUpperCase() + range.slice(1)}`, 14, 24);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
            
            // Add summary section
            doc.setFontSize(12);
            doc.text("Summary", 14, 40);
            
            // Calculate metrics directly from the current analytics data
            const totalOrders = analytics.orders?.length || 0;
            const totalSales = analytics.orders
                ? analytics.orders.reduce(
                    (acc, order) => acc + parsePrice(order.total_price),
                    0
                )
                : 0;
            const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
            const totalCustomers = analytics.totalCustomers || 0;
            
            const summaryData = [
                ["Metric", "Value"],
                ["Total Orders", totalOrders.toString()],
                ["Total Sales", `${totalSales.toFixed(2)} THB`],
                ["Average Order Value", `${averageOrderValue.toFixed(2)} THB`],
                ["Total Customers", totalCustomers.toString()]
            ];
            
            doc.autoTable({
                head: [["Metric", "Value"]],
                body: summaryData,
                startY: 45,
                margin: { top: 10 },
                styles: { fontSize: 10 }
            });
            
            // Add sales history table
            const finalY = doc.autoTable.previous?.finalY || 45;
            doc.setFontSize(12);
            doc.text("Sales History", 14, finalY + 15);
            
            const tableColumn = [
                "Paid At",
                "Order ID",
                "Table",
                "Customers",
                "Payment Method",
                "Total (THB)",
                "Status",
            ];
            const tableRows = analytics.salesHistory.map((order) => [
                order.paid_at ? new Date(order.paid_at).toLocaleString() : "N/A",
                order.id,
                order.table_number,
                order.number_of_customers,
                order.payment_method || "N/A",
                parsePrice(order.total_price).toFixed(2),
                order.status,
            ]);
            
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: (doc.autoTable.previous?.finalY || finalY) + 20,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 135, 245] }
            });
            
            doc.save(`sales_history_${range}_${new Date().toISOString().split("T")[0]}.pdf`);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            alert("Failed to export PDF. Please try again.");
        } finally {
            setExportLoading(false);
        }
    };

    const exportCSV = () => {
        if (!analytics?.salesHistory || analytics.salesHistory.length === 0) {
            alert("No sales history to export.");
            return;
        }
        
        setExportLoading(true);
        try {
            const headers = [
                "Order ID",
                "Paid At",
                "Table Number",
                "Number of Customers",
                "Payment Method",
                "Total Price (THB)",
                "Status",
            ];
            
            // Calculate metrics directly from the current analytics data
            const totalOrders = analytics.orders?.length || 0;
            const totalSales = analytics.orders
                ? analytics.orders.reduce(
                    (acc, order) => acc + parsePrice(order.total_price),
                    0
                )
                : 0;
            const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
            const totalCustomers = analytics.totalCustomers || 0;
            
            // Add summary data at the top
            const summaryData = [
                ["Report Type", `Sales History (${range})`],
                ["Generated At", new Date().toLocaleString()],
                ["Total Orders", totalOrders.toString()],
                ["Total Sales (THB)", totalSales.toFixed(2)],
                ["Average Order Value (THB)", averageOrderValue.toFixed(2)],
                ["Total Customers", totalCustomers.toString()],
                [""] // Empty row as separator
            ];
            
            const rows = analytics.salesHistory.map((order) => [
                order.id,
                order.paid_at ? new Date(order.paid_at).toLocaleString() : "N/A",
                order.table_number,
                order.number_of_customers,
                order.payment_method || "N/A",
                parsePrice(order.total_price).toFixed(2),
                order.status,
            ]);
            
            // Combine summary with data rows
            const allRows = [
                ...summaryData,
                headers,
                ...rows
            ];
            
            // Convert to CSV
            const csvContent =
                "data:text/csv;charset=utf-8," +
                allRows.map((row) => row.join(",")).join("\n");
            
            // Create download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `sales_history_${range}_${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exporting CSV:", error);
            alert("Failed to export CSV. Please try again.");
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <SideNav />
            <main className="flex-1 p-6 overflow-auto">
                <h1 className="text-2xl font-bold mb-6">Store Analytics</h1>

                {/* Top Controls */}
                <div className="flex justify-between items-center mb-6">
                    {/* Time Range Selector */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Time Range:</span>
                        <Select
                            value={range}
                            onValueChange={(value) => 
                                setRange(value as "day" | "week" | "month" | "year")
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select time range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                        <Button 
                            onClick={() => fetchAnalytics(range)}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            disabled={loading}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        <Button 
                            onClick={exportPDF}
                            className="bg-green-500 hover:bg-green-600 text-white"
                            disabled={exportLoading || !analytics}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                        <Button 
                            onClick={exportCSV}
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                            disabled={exportLoading || !analytics}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {error}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchAnalytics(range)}
                                className="ml-2"
                            >
                                Try Again
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    // Skeleton Loaders
                    <>
                        {/* Metrics Skeleton */}
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="border rounded p-4 text-center">
                                    <Skeleton className="h-6 w-20 mx-auto mb-2" />
                                    <Skeleton className="h-8 w-24 mx-auto" />
                                </div>
                            ))}
                        </section>

                        {/* Chart Skeleton */}
                        <section className="mb-8">
                            <Skeleton className="h-[300px] w-full rounded-lg" />
                        </section>

                        {/* Table Skeleton */}
                        <section className="mb-8">
                            <Skeleton className="h-8 w-48 mb-4" />
                            <div className="border rounded-lg overflow-hidden">
                                <Skeleton className="h-10 w-full" />
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        {/* Metrics Cards with Growth Indicators */}
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                            <Card className="p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <BarChart className="h-6 w-6 text-blue-500" />
                                </div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Total Orders
                                </p>
                                <div className="flex items-center justify-center">
                                    <p className="text-xl font-semibold text-gray-900">
                                        {derivedMetrics.totalOrders}
                                    </p>
                                    {derivedMetrics.ordersGrowth !== 0 && (
                                        <span className={`ml-2 text-xs flex items-center ${derivedMetrics.ordersGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {derivedMetrics.ordersGrowth > 0 ? (
                                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                            ) : (
                                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                            )}
                                            {Math.abs(derivedMetrics.ordersGrowth).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            </Card>
                            <Card className="p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <DollarSign className="h-6 w-6 text-green-500" />
                                </div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Total Sales
                                </p>
                                <div className="flex items-center justify-center">
                                    <p className="text-xl font-semibold text-gray-900">
                                        {derivedMetrics.totalSales.toFixed(2)} THB
                                    </p>
                                    {derivedMetrics.salesGrowth !== 0 && (
                                        <span className={`ml-2 text-xs flex items-center ${derivedMetrics.salesGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {derivedMetrics.salesGrowth > 0 ? (
                                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                            ) : (
                                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                            )}
                                            {Math.abs(derivedMetrics.salesGrowth).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            </Card>
                            <Card className="p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <TrendingUp className="h-6 w-6 text-purple-500" />
                                </div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Avg. Order Value
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {derivedMetrics.averageOrderValue.toFixed(2)} THB
                                </p>
                            </Card>
                            <Card className="p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <Users className="h-6 w-6 text-orange-500" />
                                </div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Total Customers
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {derivedMetrics.totalCustomers}
                                </p>
                            </Card>
                            <Card className="p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <Users className="h-6 w-6 text-teal-500" />
                                </div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Avg. Value per Customer
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {derivedMetrics.avgValuePerCustomer.toFixed(2)} THB
                                </p>
                            </Card>
                        </section>

                        {/* Enhanced Data Visualizations */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Daily Sales Chart */}
                            <Card className="shadow-sm">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BarChart className="h-5 w-5 text-blue-500" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Daily Sales
                                        </h2>
                                    </div>
                                    <Select
                                        value={chartType}
                                        onValueChange={(value) => 
                                            setChartType(value as "line" | "bar")
                                        }
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Chart Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="line">Line Chart</SelectItem>
                                            <SelectItem value="bar">Bar Chart</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="p-4 h-[300px]">
                                    {analytics?.dailySales?.length ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            {chartType === "line" ? (
                                                <LineChart
                                                    data={analytics.dailySales}
                                                    margin={{
                                                        top: 5,
                                                        right: 30,
                                                        left: 20,
                                                        bottom: 5,
                                                    }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        tick={{ fontSize: 12 }}
                                                        tickFormatter={(value) => {
                                                            const date = new Date(value);
                                                            return `${date.getDate()}/${date.getMonth() + 1}`;
                                                        }}
                                                    />
                                                    <YAxis tick={{ fontSize: 12 }} />
                                                    <Tooltip 
                                                        formatter={(value) => [`${Number(value).toFixed(2)} THB`, 'Sales']}
                                                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                                    />
                                                    <Legend />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="totalSales"
                                                        name="Sales (THB)"
                                                        stroke="#3b82f6"
                                                        activeDot={{ r: 8 }}
                                                        strokeWidth={2}
                                                    />
                                                </LineChart>
                                            ) : (
                                                <RechartsBarChart
                                                    data={analytics.dailySales}
                                                    margin={{
                                                        top: 5,
                                                        right: 30,
                                                        left: 20,
                                                        bottom: 5,
                                                    }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        tick={{ fontSize: 12 }}
                                                        tickFormatter={(value) => {
                                                            const date = new Date(value);
                                                            return `${date.getDate()}/${date.getMonth() + 1}`;
                                                        }}
                                                    />
                                                    <YAxis tick={{ fontSize: 12 }} />
                                                    <Tooltip 
                                                        formatter={(value) => [`${Number(value).toFixed(2)} THB`, 'Sales']}
                                                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                                    />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="totalSales"
                                                        name="Sales (THB)"
                                                        fill="#3b82f6"
                                                    />
                                                </RechartsBarChart>
                                            )}
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <p className="text-gray-500">No daily sales data available.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Top Items Bar Chart */}
                            <Card className="shadow-sm">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-green-500" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Top Selling Items
                                        </h2>
                                    </div>
                                    <Select
                                        value={topItemsMode}
                                        onValueChange={(value) => 
                                            setTopItemsMode(value as "quantity" | "revenue")
                                        }
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Display Mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="quantity">Quantity</SelectItem>
                                            <SelectItem value="revenue">Revenue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="p-4 h-[300px]">
                                    {analytics?.topItems?.length ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsBarChart
                                                data={analytics.topItems}
                                                layout="vertical"
                                                margin={{
                                                    top: 5,
                                                    right: 30,
                                                    left: 80,
                                                    bottom: 5,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                                <YAxis 
                                                    dataKey="name" 
                                                    type="category" 
                                                    tick={{ fontSize: 12 }}
                                                    width={80}
                                                />
                                                <Tooltip 
                                                    formatter={(value, name) => {
                                                        if (name === 'totalQuantity') return [`${value} units`, 'Quantity'];
                                                        if (name === 'totalRevenue') return [`${Number(value).toFixed(2)} THB`, 'Revenue'];
                                                        return [value, name];
                                                    }}
                                                />
                                                <Legend />
                                                {topItemsMode === "quantity" ? (
                                                    <Bar 
                                                        dataKey="totalQuantity" 
                                                        name="Quantity" 
                                                        fill="#10b981" 
                                                    />
                                                ) : (
                                                    <Bar 
                                                        dataKey="totalRevenue" 
                                                        name="Revenue (THB)" 
                                                        fill="#6366f1" 
                                                    />
                                                )}
                                            </RechartsBarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <p className="text-gray-500">No top items data available.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Sales History Table */}
                        <Card className="shadow-sm mb-8">
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-purple-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Sales History
                                    </h2>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-gray-700">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="py-3 px-4 text-left font-medium">
                                                Order ID
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium">
                                                Paid At
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium">
                                                Table
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium">
                                                Customers
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium">
                                                Payment Method
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium">
                                                Total (THB)
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium">
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
                                                    No sales history available.
                                                </td>
                                            </tr>
                                        ) : (
                                            analytics.salesHistory.map(
                                                (order) => (
                                                    <tr
                                                        key={order.id}
                                                        className="border-b hover:bg-gray-50"
                                                    >
                                                        <td className="py-3 px-4">
                                                            {order.id}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {order.paid_at
                                                                ? new Date(
                                                                      order.paid_at
                                                                  ).toLocaleString()
                                                                : "N/A"}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {order.table_number}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {
                                                                order.number_of_customers
                                                            }
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {order.payment_method ||
                                                                "N/A"}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {parsePrice(
                                                                order.total_price
                                                            ).toFixed(2)}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                                order.status === 'paid' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
}
