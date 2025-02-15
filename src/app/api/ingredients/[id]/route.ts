import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// Update ingredient details (name, quantity, unit, threshold)
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    try {
        const { name, quantity, unit, threshold } = await request.json();
        await pool.query(
            `UPDATE ingredients
       SET name = $1, quantity = $2, unit = $3, threshold = $4, updated_at = NOW()
       WHERE id = $5`,
            [name, quantity, unit, threshold, id]
        );
        return NextResponse.json({
            message: "Ingredient updated successfully",
        });
    } catch (error) {
        console.error("Error updating ingredient:", error);
        return NextResponse.json(
            { error: "Failed to update ingredient" },
            { status: 500 }
        );
    }
}

// PATCH handler for updating stock (i.e. adding to the current quantity)
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    try {
        const { amount } = await request.json();
        if (isNaN(Number(amount))) {
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            );
        }
        const result = await pool.query(
            `UPDATE ingredients 
       SET quantity = quantity + $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *;`,
            [Number(amount), id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Ingredient not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({
            message: "Stock updated successfully",
            ingredient: result.rows[0],
        });
    } catch (error) {
        console.error("Error updating stock:", error);
        return NextResponse.json(
            { error: "Failed to update stock" },
            { status: 500 }
        );
    }
}

// Delete an ingredient
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    try {
        await pool.query(
            `DELETE FROM ingredients
       WHERE id = $1`,
            [id]
        );
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
