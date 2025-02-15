// app/api/orders/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET handler: fetch all orders from the orders table
export async function GET() {
    try {
        const result = await pool.query(
            "SELECT * FROM orders ORDER BY created_at DESC"
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}

// POST handler: create a new order and update inventory if needed
export async function POST(req: Request) {
    try {
        // Parse the incoming order data
        const { tableNumber, numberOfCustomers, items, totalPrice } =
            await req.json();

        // Validate required fields
        if (!tableNumber || !numberOfCustomers || !items || !totalPrice) {
            console.error("Missing required fields:", {
                tableNumber,
                numberOfCustomers,
                items,
                totalPrice,
            });
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get a client from the pool and start a transaction
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Insert the order with default status 'in-progress'
            const orderInsertQuery = `
        INSERT INTO orders (table_number, number_of_customers, items, total_price, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
            const orderValues = [
                tableNumber,
                numberOfCustomers,
                JSON.stringify(items), // store order items as JSON
                totalPrice,
                "in-progress",
            ];
            const orderResult = await client.query(
                orderInsertQuery,
                orderValues
            );
            const order = orderResult.rows[0];

            // OPTIONAL: Update inventory for each ordered menu item
            for (const item of items) {
                const ingredientsResult = await client.query(
                    `SELECT ingredient_id, amount_required 
           FROM menu_item_ingredients 
           WHERE menu_item_id = $1`,
                    [item.id]
                );
                for (const ing of ingredientsResult.rows) {
                    const deduction = ing.amount_required * item.quantity;
                    await client.query(
                        `UPDATE ingredients 
             SET quantity = quantity - $1, updated_at = NOW() 
             WHERE id = $2`,
                        [deduction, ing.ingredient_id]
                    );
                }
            }

            await client.query("COMMIT");
            console.log("✅ Order saved successfully:", order);
            return NextResponse.json(order, { status: 201 });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Transaction failed:", error);
            return NextResponse.json(
                { error: "Transaction failed" },
                { status: 500 }
            );
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error saving order:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
