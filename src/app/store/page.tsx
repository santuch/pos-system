"use client";

import { useEffect, useState } from "react";
import SideNav from "@/components/SideNav";
import { Button } from "@/components/ui/button";
import {
    TrendingUp,
    BarChart,
    Eye,
    Download,
    RefreshCw,
    Calendar,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
    Area,
    AreaChart,
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";
import BillModal from "@/components/BillModal";

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
    const num = Number.parseFloat(String(val));
    return isNaN(num) ? 0 : num;
}

// Extend jsPDF to include the autoTable method.
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: {
        head: string[][];
        body: (string | number)[][];
        startY: number;
    }) => void;
}

// Format currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
        .format(value)
        .replace("฿", "");
};

// Calculate percentage change
const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
};

export default function StoreDashboard() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [range, setRange] = useState<"day" | "week" | "month">("day");
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [chartType, setChartType] = useState<"line" | "area" | "bar">("area");

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

    // Previous period comparisons
    const previousTotalSales = analytics?.previousPeriod?.totalSales || 0;
    const previousTotalOrders = analytics?.previousPeriod?.totalOrders || 0;

    const salesChange = calculateChange(totalSales, previousTotalSales);
    const ordersChange = calculateChange(totalOrders, previousTotalOrders);

    // ---------- Export Functions ----------
    const exportPDF = () => {
        if (!analytics?.salesHistory || analytics.salesHistory.length === 0) {
            alert("No sales history to export.");
            return;
        }
        const doc = new jsPDF();
        doc.text("Sales History", 14, 16);
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
        // Cast doc to our extended interface to access autoTable without using any.
        (doc as jsPDFWithAutoTable).autoTable({
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
            "Paid At",
            "Order ID",
            "Table",
            "Customers",
            "Payment Method",
            "Total (THB)",
            "Status",
        ];
        const rows = analytics.salesHistory.map((order) => [
            order.paid_at ? new Date(order.paid_at).toLocaleString() : "N/A",
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

    // ---------- Modal Handler ----------
    const handleViewBill = (orderId: number) => {
        setSelectedOrderId(orderId);
        setIsBillModalOpen(true);
    };

    // ---------- Chart Components ----------
    const renderChart = () => {
        if (!analytics?.dailySales?.length) {
            return (
                <p className="text-muted-foreground text-center py-10">
                    No daily sales data available.
                </p>
            );
        }

        const data = analytics.dailySales;

        if (chartType === "line") {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            tickFormatter={(value) => `${value} ฿`}
                        />
                        <ChartTooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="totalSales"
                            name="Sales"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{
                                r: 6,
                                stroke: "#8884d8",
                                strokeWidth: 2,
                                fill: "#fff",
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            );
        } else if (chartType === "area") {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            tickFormatter={(value) => `${value} ฿`}
                        />
                        <ChartTooltip content={<CustomTooltip />} />
                        <defs>
                            <linearGradient
                                id="colorSales"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#8884d8"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#8884d8"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="totalSales"
                            name="Sales"
                            stroke="#8884d8"
                            fillOpacity={1}
                            fill="url(#colorSales)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            );
        } else {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            tickFormatter={(value) => `${value} ฿`}
                        />
                        <ChartTooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="totalSales"
                            name="Sales"
                            fill="#8884d8"
                            radius={[4, 4, 0, 0]}
                        />
                    </RechartsBarChart>
                </ResponsiveContainer>
            );
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded-md shadow-md">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-sm text-violet-600">{`Sales: ${formatCurrency(
                        payload[0].value
                    )} THB`}</p>
                </div>
            );
        }
        return null;
    };

    // Status badge component
    const StatusBadge = ({ status }: { status: string }) => {
        let variant: "default" | "secondary" | "destructive" | "outline" =
            "outline";

        switch (status.toLowerCase()) {
            case "completed":
                variant = "default";
                break;
            case "pending":
                variant = "secondary";
                break;
            case "cancelled":
                variant = "destructive";
                break;
            default:
                variant = "outline";
        }

        return <Badge variant={variant}>{status}</Badge>;
    };

    return (
        <div className="flex h-screen bg-background">
            <SideNav />
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
                    <header className="mb-8 space-y-2">
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold tracking-tight">
                                Store Dashboard
                            </h1>
                            <Button
                                onClick={() => fetchAnalytics(range)}
                                variant="outline"
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </Button>
                        </div>
                        <p className="text-muted-foreground">
                            A comprehensive overview of your store&apos;s
                            performance.
                        </p>
                    </header>

                    {/* Time Range Selector */}
                    <div className="mb-8">
                        <Tabs
                            defaultValue={range}
                            onValueChange={(value) =>
                                setRange(value as "day" | "week" | "month")
                            }
                        >
                            <div className="flex items-center justify-between mb-4">
                                <TabsList>
                                    <TabsTrigger value="day" className="gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Day
                                    </TabsTrigger>
                                    <TabsTrigger value="week" className="gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Week
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="month"
                                        className="gap-2"
                                    >
                                        <Calendar className="h-4 w-4" />
                                        Month
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </Tabs>
                    </div>

                    {loading ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[...Array(4)].map((_, i) => (
                                    <Card key={i}>
                                        <CardHeader className="pb-2">
                                            <Skeleton className="h-4 w-24" />
                                        </CardHeader>
                                        <CardContent>
                                            <Skeleton className="h-8 w-32" />
                                            <Skeleton className="h-4 w-16 mt-2" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-[300px] w-full" />
                                </CardContent>
                            </Card>
                        </div>
                    ) : analytics && "error" in analytics ? (
                        <Card className="bg-destructive/10 border-destructive">
                            <CardHeader>
                                <CardTitle>Error</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>{analytics.error}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Metrics Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Total Sales
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline justify-between">
                                            <div className="text-2xl font-bold">
                                                {formatCurrency(totalSales)} THB
                                            </div>
                                            {previousTotalSales > 0 && (
                                                <div
                                                    className={`flex items-center text-xs font-medium ${
                                                        salesChange >= 0
                                                            ? "text-green-500"
                                                            : "text-red-500"
                                                    }`}
                                                >
                                                    {salesChange >= 0 ? (
                                                        <ArrowUp className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <ArrowDown className="h-3 w-3 mr-1" />
                                                    )}
                                                    {Math.abs(
                                                        salesChange
                                                    ).toFixed(1)}
                                                    %
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Compared to previous {range}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Total Orders
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline justify-between">
                                            <div className="text-2xl font-bold">
                                                {totalOrders}
                                            </div>
                                            {previousTotalOrders > 0 && (
                                                <div
                                                    className={`flex items-center text-xs font-medium ${
                                                        ordersChange >= 0
                                                            ? "text-green-500"
                                                            : "text-red-500"
                                                    }`}
                                                >
                                                    {ordersChange >= 0 ? (
                                                        <ArrowUp className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <ArrowDown className="h-3 w-3 mr-1" />
                                                    )}
                                                    {Math.abs(
                                                        ordersChange
                                                    ).toFixed(1)}
                                                    %
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Compared to previous {range}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Avg. Order Value
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(averageOrderValue)}{" "}
                                            THB
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {totalOrders} orders total
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Total Customers
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {totalCustomers}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatCurrency(
                                                avgValuePerCustomer
                                            )}{" "}
                                            THB per customer
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sales Chart Section */}
                            <Card className="mb-8">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart className="h-5 w-5 text-primary" />
                                            Sales Overview
                                        </CardTitle>
                                        <Select
                                            value={chartType}
                                            onValueChange={(value) =>
                                                setChartType(
                                                    value as
                                                        | "line"
                                                        | "area"
                                                        | "bar"
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Chart Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="line">
                                                    Line Chart
                                                </SelectItem>
                                                <SelectItem value="area">
                                                    Area Chart
                                                </SelectItem>
                                                <SelectItem value="bar">
                                                    Bar Chart
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <CardDescription>
                                        Sales performance over the selected time
                                        period
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <ChartContainer config={{}}>
                                        {renderChart()}
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            {/* Best Seller Items Section */}
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold tracking-tight mb-4">
                                    Best Selling Items
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {analytics?.topItems &&
                                    analytics.topItems.length > 0 ? (
                                        analytics.topItems.map((item) => (
                                            <Card
                                                key={item.name}
                                                className="overflow-hidden"
                                            >
                                                <CardHeader className="pb-2">
                                                    <CardTitle>
                                                        {item.name}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="pb-2">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-muted-foreground">
                                                                Quantity
                                                            </p>
                                                            <p className="text-2xl font-bold">
                                                                {
                                                                    item.totalQuantity
                                                                }
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-muted-foreground">
                                                                Revenue
                                                            </p>
                                                            <p className="text-2xl font-bold">
                                                                {formatCurrency(
                                                                    item.totalRevenue
                                                                )}{" "}
                                                                THB
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                                <div className="h-2 bg-primary/10 w-full">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                (item.totalQuantity /
                                                                    (analytics
                                                                        .topItems[0]
                                                                        ?.totalQuantity ||
                                                                        1)) *
                                                                    100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <Card className="col-span-full">
                                            <CardContent className="py-10 text-center">
                                                <p className="text-muted-foreground">
                                                    No best seller items
                                                    available.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>

                            {/* Sales History Section */}
                            <div className="mb-8">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-primary" />
                                                Sales History
                                            </CardTitle>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Export
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={exportCSV}
                                                    >
                                                        Export as CSV
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={exportPDF}
                                                    >
                                                        Export as PDF
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <CardDescription>
                                            Complete history of all sales
                                            transactions
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Order ID
                                                        </TableHead>
                                                        <TableHead>
                                                            Paid At
                                                        </TableHead>
                                                        <TableHead>
                                                            Table
                                                        </TableHead>
                                                        <TableHead>
                                                            Customers
                                                        </TableHead>
                                                        <TableHead>
                                                            Payment Method
                                                        </TableHead>
                                                        <TableHead>
                                                            Total (THB)
                                                        </TableHead>
                                                        <TableHead>
                                                            Status
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Actions
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {!analytics?.salesHistory
                                                        ?.length ? (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={8}
                                                                className="h-24 text-center"
                                                            >
                                                                No results
                                                                found.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        analytics.salesHistory.map(
                                                            (order) => (
                                                                <TableRow
                                                                    key={
                                                                        order.id
                                                                    }
                                                                >
                                                                    <TableCell className="font-medium">
                                                                        {
                                                                            order.id
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {order.paid_at
                                                                            ? new Date(
                                                                                  order.paid_at
                                                                              ).toLocaleString()
                                                                            : "N/A"}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {
                                                                            order.table_number
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {
                                                                            order.number_of_customers
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {order.payment_method ||
                                                                            "N/A"}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {formatCurrency(
                                                                            parsePrice(
                                                                                order.total_price
                                                                            )
                                                                        )}{" "}
                                                                        THB
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <StatusBadge
                                                                            status={
                                                                                order.status
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleViewBill(
                                                                                    order.id
                                                                                )
                                                                            }
                                                                            className="h-8 gap-1"
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                            View
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        )
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Bill Modal */}
            <BillModal
                orderId={selectedOrderId}
                isOpen={isBillModalOpen}
                onClose={() => setIsBillModalOpen(false)}
            />
        </div>
    );
}
