import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
    try {
        // Query menus along with their ingredients (if any)
        const menusRes = await pool.query(`
      SELECT m.*, 
             json_agg(
               json_build_object(
                 'ingredient_id', i.id,
                 'name', i.name,
                 'amount_required', mi.amount_required
               )
             ) AS ingredients
      FROM menus m
      LEFT JOIN menu_item_ingredients mi ON m.id = mi.menu_item_id
      LEFT JOIN ingredients i ON mi.ingredient_id = i.id
      GROUP BY m.id
    `);
        return NextResponse.json(menusRes.rows, { status: 200 });
    } catch (error) {
        console.error("Error fetching menus:", error);
        return NextResponse.json(
            { error: "Error fetching menus" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { name, category, price, description, image_url, ingredients } =
            await request.json();
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Insert the new menu record
            const menuRes = await client.query(
                `INSERT INTO menus (name, category, price, description, image_url)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [name, category, price, description, image_url]
            );
            const menuId = menuRes.rows[0].id;

            // Process ingredients if provided
            if (ingredients && Array.isArray(ingredients)) {
                for (const ingredient of ingredients) {
                    // Check if this ingredient exists by name
                    const existing = await client.query(
                        `SELECT id FROM ingredients WHERE name = $1`,
                        [ingredient.name]
                    );
                    let ingredientId;
                    if (existing.rows.length > 0) {
                        ingredientId = existing.rows[0].id;
                    } else {
                        // Create a new ingredient record (using default values for quantity/threshold)
                        const newIngredient = await client.query(
                            `INSERT INTO ingredients (name, unit, quantity, threshold)
               VALUES ($1, $2, 0, 0) RETURNING id`,
                            [ingredient.name, "unit"] // You can modify the unit or include it in the payload
                        );
                        ingredientId = newIngredient.rows[0].id;
                    }
                    // Insert the pivot record linking the menu and ingredient
                    await client.query(
                        `INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, amount_required)
             VALUES ($1, $2, $3)`,
                        [menuId, ingredientId, ingredient.amount]
                    );
                }
            }

            await client.query("COMMIT");
            return NextResponse.json({ id: menuId }, { status: 201 });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Transaction error:", error);
            return NextResponse.json(
                { error: "Transaction failed" },
                { status: 500 }
            );
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error processing POST request:", error);
        return NextResponse.json(
            { error: "Error processing request" },
            { status: 500 }
        );
    }
}
