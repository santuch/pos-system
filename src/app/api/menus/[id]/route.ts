import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Update Menu Item (PUT)
export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    const menuId = params.id;

    const { name, category, price, description, image_url } = await req.json();

    try {
        const query = `
            UPDATE menus 
            SET name = $1, category = $2, price = $3, description = $4, image_url = $5 
            WHERE id = $6 RETURNING *;
        `;
        const values = [name, category, price, description, image_url, menuId];

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Menu item not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Menu item updated",
            menu: result.rows[0],
        });
    } catch (error) {
        console.error("Error updating menu item:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// Delete Menu Item (DELETE)
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const menuId = params.id; // No need to await params

    try {
        const query = "DELETE FROM menus WHERE id = $1 RETURNING *;";
        const result = await pool.query(query, [menuId]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Menu item not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Menu item deleted" });
    } catch (error) {
        console.error("Error deleting menu item:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
