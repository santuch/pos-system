import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Fetch all ingredients
export async function GET() {
    try {
        const result = await pool.query(
            `SELECT * FROM ingredients ORDER BY quantity-threshold ASC`
        );
        
        // Capitalize first letter of each ingredient name
        const ingredients = result.rows.map(ing => ({
            ...ing,
            name: ing.name.charAt(0).toUpperCase() + ing.name.slice(1)
        }));
        
        return NextResponse.json(ingredients);
    } catch (error) {
        console.error("Error fetching ingredients:", error);
        return NextResponse.json(
            { error: "Failed to fetch ingredients" },
            { status: 500 }
        );
    }
}

// POST: Create a new ingredient
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, quantity, unit, threshold } = body;
        
        // Check for existing ingredient (case-insensitive)
        const existing = await pool.query(
            `SELECT id FROM ingredients WHERE LOWER(name) = LOWER($1)`,
            [name]
        );
        
        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: "Ingredient already exists" },
                { status: 400 }
            );
        }
        
        // Store in lowercase
        const result = await pool.query(
            `INSERT INTO ingredients (name, quantity, unit, threshold)
            VALUES (LOWER($1), $2, $3, $4) RETURNING *`,
            [name.toLowerCase(), quantity, unit, threshold]
        );
        
        // Return with capitalized first letter
        const ingredient = result.rows[0];
        ingredient.name = ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1);
        
        return NextResponse.json(ingredient, { status: 201 });
    } catch (error) {
        console.error("Error creating ingredient:", error);
        return NextResponse.json(
            { error: "Failed to create ingredient" },
            { status: 500 }
        );
    }
}
