import { NextResponse } from "next/server";
import pool from "@/lib/db";

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

            // Insert the order into the orders table
            const orderInsertQuery = `
        INSERT INTO orders (table_number, number_of_customers, items, total_price)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
            const orderValues = [
                tableNumber,
                numberOfCustomers,
                JSON.stringify(items), // store order items as JSON
                totalPrice,
            ];
            const orderResult = await client.query(
                orderInsertQuery,
                orderValues
            );
            const order = orderResult.rows[0];

            // Update inventory for each ordered menu item
            // We assume each item in the "items" array has an "id" property for the menu item
            for (const item of items) {
                // Get the list of ingredients and their required amounts for the current menu item
                const ingredientsResult = await client.query(
                    `SELECT ingredient_id, amount_required 
           FROM menu_item_ingredients 
           WHERE menu_item_id = $1`,
                    [item.id]
                );
                // For each ingredient used by the menu item, calculate the total deduction based on quantity ordered
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

            // Commit the transaction if all queries succeed
            await client.query("COMMIT");
            console.log("✅ Order saved successfully:", order);
            return NextResponse.json(order, { status: 201 });
        } catch (error) {
            // Roll back if anything fails during the transaction
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
