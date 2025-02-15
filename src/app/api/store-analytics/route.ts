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
            dateCondition = "1=1";
        }
    } else {
        dateCondition = "1=1";
    }

    // For queries joining orders (aliased as o), qualify the "created_at" column.
    const ordersDateCondition =
        dateCondition === "1=1"
            ? "1=1"
            : dateCondition.replace("created_at", "o.created_at");

    try {
        // 1. Fetch all 'paid' orders within the current period, including payment_method.
        const ordersRes = await pool.query(`
      SELECT
        o.*,
        COALESCE(p.payment_method, 'N/A') AS payment_method
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.status = 'paid'
        AND ${ordersDateCondition}
      ORDER BY o.created_at DESC
    `);
        const orders = ordersRes.rows;

        // 2. Calculate daily sales by grouping paid orders by date.
        const dailySalesRes = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
             SUM(total_price) AS "totalSales"
      FROM orders
      WHERE status = 'paid'
        AND ${dateCondition}
      GROUP BY date
      ORDER BY date;
    `);
        const dailySales = dailySalesRes.rows.map((row: any) => ({
            date: row.date,
            totalSales: parseFloat(row.totalSales),
        }));

        // 3. Determine top-selling items using the normalized "order_items" table.
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
      ORDER BY "totalRevenue" DESC
      LIMIT 5;
    `);
        const topItems = topItemsRes.rows.map((row: any) => ({
            name: row.name,
            totalQuantity: parseInt(row.totalQuantity, 10),
            totalRevenue: parseFloat(row.totalRevenue),
        }));

        // 4. Sales history: return the list of paid orders.
        const salesHistory = orders;

        // 5. Total customers: Sum the number_of_customers from paid orders.
        const totalCustomersRes = await pool.query(`
      SELECT COALESCE(SUM(number_of_customers), 0) AS total
      FROM orders
      WHERE status = 'paid'
        AND ${dateCondition}
    `);
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
