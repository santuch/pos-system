import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Retrieve a specific menu by ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const result = await pool.query(`SELECT * FROM menus WHERE id = $1`, [
            id,
        ]);
        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Menu not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching menu:", error);
        return NextResponse.json(
            { error: "Failed to fetch menu" },
            { status: 500 }
        );
    }
}

// PUT: Update an existing menu by ID
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const { name, category, price, description, image_url } = body;

        // Validate required fields for update
        if (!name || price === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: name and price" },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `UPDATE menus
       SET name = $1, category = $2, price = $3, description = $4, image_url = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
            [name, category, price, description, image_url, id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Menu not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating menu:", error);
        return NextResponse.json(
            { error: "Failed to update menu" },
            { status: 500 }
        );
    }
}

// DELETE: Remove a menu by ID
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Delete dependent order_items first (if necessary)
        await pool.query(`DELETE FROM order_items WHERE menu_item_id = $1`, [
            id,
        ]);

        // Then, delete from menus
        const result = await pool.query(
            `DELETE FROM menus WHERE id = $1 RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Menu not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({
            message: "Menu deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting menu:", error);
        return NextResponse.json(
            { error: "Failed to delete menu" },
            { status: 500 }
        );
    }
}
