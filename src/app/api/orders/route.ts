import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Fetch all orders with nested order items (including menu item names)
export async function GET() {
    try {
        // Each order item object includes the id, name (from the menus table), price_at_order, and quantity.
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
      GROUP BY o.id
      ORDER BY o.created_at ASC
    `;
        const result = await pool.query(query);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Error fetching orders with items:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}

// POST: Place a new order and update ingredient stock accordingly
export async function POST(request: Request) {
    try {
        // Extract snake_case keys from the request body
        const { table_number, number_of_customers, total_price, order_items } =
            await request.json();

        // Validate required fields
        if (
            !table_number ||
            !number_of_customers ||
            !order_items ||
            !Array.isArray(order_items) ||
            order_items.length === 0 ||
            total_price === undefined
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Insert the new order into the orders table.
            const orderInsertQuery = `
          INSERT INTO orders (table_number, number_of_customers, total_price, status)
          VALUES ($1, $2, $3, 'in-progress')
          RETURNING *
        `;
            const orderResult = await client.query(orderInsertQuery, [
                table_number,
                number_of_customers,
                total_price,
            ]);
            const order = orderResult.rows[0];

            // Loop through each order item
            for (const item of order_items) {
                const orderItemInsertQuery = `
            INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order)
            VALUES ($1, $2, $3, $4)
          `;
                await client.query(orderItemInsertQuery, [
                    order.id,
                    item.menu_item_id, // make sure the frontend sends menu_item_id
                    item.quantity,
                    item.price_at_order, // ensure this key matches what you're sending from the frontend
                ]);

                // Fetch the ingredients required for this menu item from the pivot table
                const pivotQuery = `
            SELECT ingredient_id, amount_required 
            FROM menu_item_ingredients 
            WHERE menu_item_id = $1
          `;
                const pivotResult = await client.query(pivotQuery, [
                    item.menu_item_id,
                ]);

                // Deduct ingredient stock for each required ingredient
                for (const pivotRow of pivotResult.rows) {
                    const deduction =
                        Number(pivotRow.amount_required) * item.quantity;
                    await client.query(
                        `UPDATE ingredients 
               SET quantity = quantity - $1, updated_at = NOW() 
               WHERE id = $2`,
                        [deduction, pivotRow.ingredient_id]
                    );
                }
            }

            await client.query("COMMIT");
            return NextResponse.json(order, { status: 201 });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Transaction error:", error);
            return NextResponse.json(
                { error: "Failed to place order" },
                { status: 500 }
            );
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error processing order:", error);
        return NextResponse.json(
            { error: "Failed to process order" },
            { status: 500 }
        );
    }
}
