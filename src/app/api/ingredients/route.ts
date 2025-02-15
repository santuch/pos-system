import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Fetch all ingredients
export async function GET() {
    try {
        const result = await pool.query(
            `SELECT * FROM ingredients ORDER BY created_at ASC`
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
        const { name, quantity, unit, threshold } = body;
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

// PUT: Update an existing ingredient
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const { name, quantity, unit, threshold } = body;
        const result = await pool.query(
            `UPDATE ingredients
       SET name = $1, quantity = $2, unit = $3, threshold = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
            [name, quantity, unit, threshold, id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Ingredient not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating ingredient:", error);
        return NextResponse.json(
            { error: "Failed to update ingredient" },
            { status: 500 }
        );
    }
}

// DELETE: Remove an ingredient
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        await pool.query(`DELETE FROM ingredients WHERE id = $1`, [id]);
        return NextResponse.json({
            message: "Ingredient deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting ingredient:", error);
        return NextResponse.json(
            { error: "Failed to delete ingredient" },
            { status: 500 }
        );
    }
}

// PATCH: Update stock (add stock) for an ingredient
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const { amount } = await request.json();
        // Update the ingredient by adding the given amount
        const result = await pool.query(
            `UPDATE ingredients
       SET quantity = quantity + $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
            [amount, id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Ingredient not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating stock:", error);
        return NextResponse.json(
            { error: "Failed to update stock" },
            { status: 500 }
        );
    }
}
