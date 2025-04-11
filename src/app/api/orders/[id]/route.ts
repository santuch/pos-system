import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Retrieve a single order by ID with its nested order items
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const query = `
      SELECT
        o.id,
        o.table_number,
        o.number_of_customers,
        o.total_price,
        o.status,
        o.created_at,
        o.updated_at,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', oi.id,
              'name', m.name,
              'price', oi.price_at_order,
              'quantity', oi.quantity
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menus m ON oi.menu_item_id = m.id
      WHERE o.id = $1
      GROUP BY o.id
    `;
        const result = await pool.query(query, [params.id]);
        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { error: "Failed to fetch order" },
            { status: 500 }
        );
    }
}

// PATCH: Update order status (allowed statuses: in-progress, ready, waiting-for-payment, paid, cancelled)
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Get the order id from params
        const { id } = await params;
        // Get new status from request body
        const { status } = await req.json();
        const allowedStatuses = [
            "in-progress",
            "ready",
            "waiting-for-payment",
            "paid",
            "cancelled",
        ];
        if (!allowedStatuses.includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }
        const query = `
      UPDATE orders 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `;
        const result = await pool.query(query, [status, id]);
        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({
            message: "Order status updated",
            order: result.rows[0],
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json(
            { error: "Failed to update order status" },
            { status: 500 }
        );
    }
}
