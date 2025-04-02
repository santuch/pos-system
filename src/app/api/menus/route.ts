import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Fetch all menus with associated ingredients
export async function GET() {
    try {
        const query = `
      SELECT
        m.id,
        m.name,
        m.category,
        m.price,
        m.description,
        m.image_url,
        m.created_at,
        m.updated_at,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', i.id,
              'name', i.name,
              'quantity', i.quantity,
              'unit', i.unit,
              'threshold', i.threshold,
              'amount', mii.amount_required
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS ingredients
      FROM menus m
      LEFT JOIN menu_item_ingredients mii ON m.id = mii.menu_item_id
      LEFT JOIN ingredients i ON mii.ingredient_id = i.id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `;
        const result = await pool.query(query);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Error fetching menus with ingredients:", error);
        return NextResponse.json(
            { error: "Failed to fetch menus" },
            { status: 500 }
        );
    }
}

// POST: Create a new menu item and associate ingredients
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, category, price, description, image_url, ingredients } =
            body;

        if (!name || !price || !image_url) {
            return NextResponse.json(
                { error: "Missing required fields: name, price, or image_url" },
                { status: 400 }
            );
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const menuInsertQuery = `
        INSERT INTO menus (name, category, price, description, image_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
            const menuInsertRes = await client.query(menuInsertQuery, [
                name,
                category,
                price,
                description,
                image_url,
            ]);
            const menu = menuInsertRes.rows[0];

            // Process each provided ingredient (expected format: { id?, name, amount })
            if (ingredients && Array.isArray(ingredients)) {
                for (const ing of ingredients) {
                    let ingredientId = ing.id;
                    if (!ingredientId) {
                        // find ingredient by name (case-insensitive)
                        const findRes = await client.query(
                            `SELECT id FROM ingredients WHERE name ILIKE $1 LIMIT 1`,
                            [ing.name]
                        );
                        if (findRes.rows.length > 0) {
                            ingredientId = findRes.rows[0].id;
                        } else {
                            // Insert new ingredient with default values
                            const insertIngRes = await client.query(
                                `INSERT INTO ingredients (name, quantity, unit, threshold)
                 VALUES ($1, 0, 'unit', 0)
                 RETURNING id`,
                                [ing.name]
                            );
                            ingredientId = insertIngRes.rows[0].id;
                        }
                    }
                    await client.query(
                        `INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, amount_required)
             VALUES ($1, $2, $3)`,
                        [menu.id, ingredientId, ing.amount || 0]
                    );
                }
            }

            await client.query("COMMIT");
            return NextResponse.json(menu, { status: 201 });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Transaction error:", error);
            return NextResponse.json(
                { error: "Failed to create menu" },
                { status: 500 }
            );
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error processing menu:", error);
        return NextResponse.json(
            { error: "Failed to process menu" },
            { status: 500 }
        );
    }
}
