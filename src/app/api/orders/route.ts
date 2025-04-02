import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Fetch all orders, including order items (joined with menus), with pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

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
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [pageSize, offset]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching orders with items:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST: Place a new order and reduce ingredient stock accordingly
export async function POST(request: Request) {
    try {
        const { tableNumber, numberOfCustomers, items, totalPrice } =
            await request.json();

        if (
            !tableNumber ||
            !numberOfCustomers ||
            !items ||
            items.length === 0 ||
            !totalPrice
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Insert the order
            const orderInsertQuery = `
        INSERT INTO orders (table_number, number_of_customers, total_price, status)
        VALUES ($1, $2, $3, 'in-progress')
        RETURNING *
      `;
            const orderResult = await client.query(orderInsertQuery, [
                tableNumber,
                numberOfCustomers,
                totalPrice,
            ]);
            const order = orderResult.rows[0];

            // Insert order items and update ingredient quantities in a single transaction
            for (const item of items) {
                const orderItemInsertQuery = `
          INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
                await client.query(orderItemInsertQuery, [
                    order.id,
                    item.id,
                    item.quantity,
                    item.price,
                ]);
            }

            // Update ingredient quantities using a single SQL query
            const updateIngredientsQuery = `
        UPDATE ingredients
        SET
          quantity = CASE
            WHEN ingredients.id IN (
              SELECT mii.ingredient_id
              FROM menu_item_ingredients mii
              JOIN order_items oi ON mii.menu_item_id = oi.menu_item_id
              WHERE oi.order_id = $1
            )
            THEN ingredients.quantity - (
              SELECT SUM(mii.amount_required * oi.quantity)
              FROM menu_item_ingredients mii
              JOIN order_items oi ON mii.menu_item_id = oi.menu_item_id
              WHERE oi.order_id = $1
                AND mii.ingredient_id = ingredients.id
            )
            ELSE ingredients.quantity
          END,
          updated_at = NOW()
        WHERE
          ingredients.id IN (
            SELECT mii.ingredient_id
            FROM menu_item_ingredients mii
            JOIN order_items oi ON mii.menu_item_id = oi.menu_item_id
            WHERE oi.order_id = $1
          )
      `;
            await client.query(updateIngredientsQuery, [order.id]);

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
