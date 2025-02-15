// app/api/store-analytics/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
    // Parse query parameters from the URL
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "day";

    // Build a date filter condition for the current period.
    let dateCondition = "";
    if (range === "day") {
        dateCondition = "created_at >= NOW() - INTERVAL '1 day'";
    } else if (range === "week") {
        dateCondition = "created_at >= NOW() - INTERVAL '7 days'";
    } else if (range === "month") {
        dateCondition = "created_at >= NOW() - INTERVAL '30 days'";
    } else if (range === "year") {
        dateCondition = "created_at >= NOW() - INTERVAL '365 days'";
    } else if (range === "custom") {
        // For a custom date range, you must supply both 'start' and 'end'
        const start = searchParams.get("start");
        const end = searchParams.get("end");
        if (start && end) {
            dateCondition = `created_at >= '${start}' AND created_at <= '${end}'`;
        } else {
            // If custom but missing dates, fallback to no date filter.
            dateCondition = "1=1";
        }
    } else {
        dateCondition = "1=1";
    }

    try {
        // 1. Fetch all 'paid' orders within the current period.
        const ordersRes = await pool.query(
            `SELECT * 
       FROM orders
       WHERE status = 'paid'
         AND ${dateCondition}
       ORDER BY created_at DESC`
        );
        const orders = ordersRes.rows;

        // 2. Calculate daily sales by grouping paid orders by date.
        const dailySalesRes = await pool.query(
            `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date,
              SUM(total_price) as "totalSales"
       FROM orders
       WHERE status = 'paid'
         AND ${dateCondition}
       GROUP BY date
       ORDER BY date;`
        );
        const dailySales = dailySalesRes.rows.map((row: any) => ({
            date: row.date,
            totalSales: parseFloat(row.totalSales),
        }));

        // 3. Determine top-selling items by expanding the JSON array in "items".
        const topItemsRes = await pool.query(
            `SELECT item->>'name' as name,
              SUM((item->>'quantity')::int) as "totalQuantity",
              SUM(((item->>'quantity')::int * (item->>'price')::numeric)) as "totalRevenue"
       FROM orders,
            jsonb_array_elements(items::jsonb) as item
       WHERE status = 'paid'
         AND ${dateCondition}
       GROUP BY name
       ORDER BY "totalRevenue" DESC
       LIMIT 5;`
        );
        const topItems = topItemsRes.rows.map((row: any) => ({
            name: row.name,
            totalQuantity: parseInt(row.totalQuantity, 10),
            totalRevenue: parseFloat(row.totalRevenue),
        }));

        // 4. Sales history: return the list of paid orders (could be paginated in a real app)
        const salesHistory = orders;

        // 5. Total customers: Sum the number_of_customers from paid orders.
        const totalCustomersRes = await pool.query(
            `SELECT COALESCE(SUM(number_of_customers), 0) as total
       FROM orders
       WHERE status = 'paid'
         AND ${dateCondition}`
        );
        const totalCustomers = parseInt(totalCustomersRes.rows[0].total, 10);

        // 6. Optional: Previous period analytics for comparison.
        let previousPeriod = null;
        if (["day", "week", "month", "year"].includes(range)) {
            let prevDateCondition = "";
            if (range === "day") {
                prevDateCondition =
                    "created_at < NOW() - INTERVAL '1 day' AND created_at >= NOW() - INTERVAL '2 day'";
            } else if (range === "week") {
                prevDateCondition =
                    "created_at < NOW() - INTERVAL '7 days' AND created_at >= NOW() - INTERVAL '14 days'";
            } else if (range === "month") {
                prevDateCondition =
                    "created_at < NOW() - INTERVAL '30 days' AND created_at >= NOW() - INTERVAL '60 days'";
            } else if (range === "year") {
                prevDateCondition =
                    "created_at < NOW() - INTERVAL '365 days' AND created_at >= NOW() - INTERVAL '730 days'";
            }
            const prevSalesRes = await pool.query(
                `SELECT COALESCE(SUM(total_price), 0) as totalSales, COUNT(*) as totalOrders
         FROM orders
         WHERE status = 'paid'
           AND ${prevDateCondition}`
            );
            previousPeriod = {
                totalSales: parseFloat(prevSalesRes.rows[0].totalSales),
                totalOrders: parseInt(prevSalesRes.rows[0].totalOrders, 10),
            };
        }

        return NextResponse.json({
            orders,
            dailySales,
            topItems,
            salesHistory,
            totalCustomers,
            previousPeriod,
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
