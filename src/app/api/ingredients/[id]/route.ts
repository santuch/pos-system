import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
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
        const { id } = await params;
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
        const { id } = await params;
        const { amount } = await request.json();
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
