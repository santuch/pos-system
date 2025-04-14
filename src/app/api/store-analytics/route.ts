import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Define types for your query results
interface Order {
    id: number;
    status: string;
    created_at: string;
    // Add other fields as needed based on your orders table schema
}

interface DailySalesRow {
    date: string;
    totalSales: string; // This comes from the query as a string
}

interface TopItemRow {
    name: string;
    totalQuantity: string; // from the query, typically as string
    totalRevenue: string; // from the query, typically as string
}

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
    } else {
        dateCondition = "1=1";
    }

    try {
        const ordersRes = await pool.query(`
      SELECT
        o.*,
        p.created_at AS paid_at,  -- The time payment was made
        COALESCE(p.payment_method, 'N/A') AS payment_method
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.status = 'paid'
        AND ${dateCondition.replace('created_at', 'o.created_at')}
      ORDER BY p.created_at DESC  -- Sort by payment time, newest first
    `);
        // You can further type-check the orders if you have an Order interface
        const orders: Order[] = ordersRes.rows;

        const dailySalesRes = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
             SUM(total_price) AS "totalSales"
      FROM orders
      WHERE status = 'paid'
        AND ${dateCondition}
      GROUP BY date
      ORDER BY date;
    `);
        // Type the rows using DailySalesRow interface
        const dailySales = dailySalesRes.rows.map((row: DailySalesRow) => ({
            date: row.date,
            totalSales: parseFloat(row.totalSales),
        }));

        // Adjust the date condition for top items if needed.
        const topItemsDateCondition =
            dateCondition === "1=1"
                ? "1=1"
                : dateCondition.replace("created_at", "o.created_at");

        const topItemsRes = await pool.query(`
      SELECT m.name,
             SUM(oi.quantity) AS "totalQuantity",
             SUM(oi.quantity * oi.price_at_order) AS "totalRevenue"
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN menus m ON oi.menu_item_id = m.id
      WHERE o.status = 'paid'
        AND ${topItemsDateCondition}
      GROUP BY m.name
      ORDER BY "totalQuantity" DESC
      LIMIT 5;
    `);
        // Type the rows using TopItemRow interface
        const topItems = topItemsRes.rows.map((row: TopItemRow) => ({
            name: row.name,
            totalQuantity: parseInt(row.totalQuantity, 10),
            totalRevenue: parseFloat(row.totalRevenue),
        }));

        const salesHistory = orders;

        const totalCustomersRes = await pool.query(`
      SELECT COALESCE(SUM(number_of_customers), 0) AS total
      FROM orders
      WHERE status = 'paid'
        AND ${dateCondition}
    `);
        const totalCustomers = parseInt(totalCustomersRes.rows[0].total, 10);

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
            const prevSalesRes = await pool.query(`
        SELECT COALESCE(SUM(total_price), 0) AS "totalSales",
               COUNT(*) AS "totalOrders"
        FROM orders
        WHERE status = 'paid'
          AND ${prevDateCondition}
      `);
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
