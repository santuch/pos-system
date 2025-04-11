import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Fetch all ingredients, ordering by (quantity - threshold) ascending
export async function GET() {
    try {
        const result = await pool.query(
            `SELECT * FROM ingredients ORDER BY (quantity - threshold) ASC`
        );
        return NextResponse.json(result.rows);
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

        // Optionally, add input validation here
        const { name, quantity, unit, threshold } = body;
        if (
            !name ||
            quantity === undefined ||
            !unit ||
            threshold === undefined
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `INSERT INTO ingredients (name, quantity, unit, threshold)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, quantity, unit, threshold]
        );
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error("Error creating ingredient:", error);
        return NextResponse.json(
            { error: "Failed to create ingredient" },
            { status: 500 }
        );
    }
}
