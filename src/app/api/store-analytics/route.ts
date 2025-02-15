import { NextResponse } from "next/server";
import { headers } from "next/headers";
import pool from "@/lib/db"; // adjust if your db connection is located elsewhere

export async function GET(request: Request) {
    // Extract "range" from the query params (day, week, month, year).
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "day";

    // Build date filtering condition.
    // If you don't want to filter by date, set dateCondition = "1=1".
    let dateCondition = "";
    if (range === "day") {
        dateCondition = "created_at >= NOW() - INTERVAL '1 day'";
    } else if (range === "week") {
        dateCondition = "created_at >= NOW() - INTERVAL '7 days'";
    } else if (range === "month") {
        dateCondition = "created_at >= NOW() - INTERVAL '30 days'";
    } else if (range === "year") {
        dateCondition = "created_at >= NOW() - INTERVAL '365 days'";
    } else {
        dateCondition = "1=1"; // no filtering
    }

    try {
        // 1. Fetch all 'paid' orders within the date range, for reference or building metrics.
        const ordersRes = await pool.query(
            `SELECT * 
       FROM orders
       WHERE status = 'paid' 
         AND ${dateCondition}
       ORDER BY created_at DESC`
        );
        const orders = ordersRes.rows;

        // 2. Calculate daily sales (group orders by date, summing total_price).
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

        // 3. Top-selling items:
        //    We expand the items JSON array using jsonb_array_elements,
        //    then group by item name, summing up quantity and revenue.
        //    Note: This assumes items::jsonb has "price" (numeric) and "quantity" (int).
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

        // 4. Sales history:
        //    We'll simply return the 'paid' orders within the date range as your salesHistory.
        const salesHistory = orders;

        // 5. Total customers: sum of number_of_customers across paid orders in range.
        const totalCustomersRes = await pool.query(
            `SELECT COALESCE(SUM(number_of_customers), 0) as total
       FROM orders
       WHERE status = 'paid'
         AND ${dateCondition};`
        );
        const totalCustomers = parseInt(totalCustomersRes.rows[0].total, 10);

        // Return all analytics data in JSON format
        return NextResponse.json({
            orders, // All paid orders in the date range
            dailySales, // Summed by day
            topItems, // Top 5 items by revenue
            salesHistory, // Same as orders, but used specifically for history
            totalCustomers,
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
