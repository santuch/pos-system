// Path: /menus/[id]/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic"; 

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const { name, category, price, description, image_url, ingredients } =
            await request.json();
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Update the menu record
            await client.query(
                `UPDATE menus 
         SET name = $1, category = $2, price = $3, description = $4, image_url = $5, updated_at = NOW()
         WHERE id = $6`,
                [name, category, price, description, image_url, id]
            );

            // Remove existing ingredient associations
            await client.query(
                `DELETE FROM menu_item_ingredients WHERE menu_item_id = $1`,
                [id]
            );

            // Process updated ingredients (if provided)
            if (ingredients && Array.isArray(ingredients)) {
                for (const ingredient of ingredients) {
                    const existing = await client.query(
                        `SELECT id FROM ingredients WHERE name = $1`,
                        [ingredient.name]
                    );
                    let ingredientId;
                    if (existing.rows.length > 0) {
                        ingredientId = existing.rows[0].id;
                    } else {
                        const newIngredient = await client.query(
                            `INSERT INTO ingredients (name, unit, quantity, threshold)
               VALUES ($1, $2, 0, 0) RETURNING id`,
                            [ingredient.name, "unit"]
                        );
                        ingredientId = newIngredient.rows[0].id;
                    }
                    await client.query(
                        `INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, amount_required)
             VALUES ($1, $2, $3)`,
                        [id, ingredientId, ingredient.amount]
                    );
                }
            }

            await client.query("COMMIT");
            return NextResponse.json(
                { message: "Menu updated successfully" },
                { status: 200 }
            );
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Error updating menu:", error);
            return NextResponse.json(
                { error: "Update failed" },
                { status: 500 }
            );
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error processing PUT request:", error);
        return NextResponse.json(
            { error: "Error processing request" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        // Assuming foreign keys with ON DELETE CASCADE handle the pivot table removal.
        await pool.query(`DELETE FROM menus WHERE id = $1`, [id]);
        return NextResponse.json(
            { message: "Menu deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting menu:", error);
        return NextResponse.json(
            { error: "Error deleting menu" },
            { status: 500 }
        );
    }
}
