import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Retrieve all menus
export async function GET() {
    try {
        const result = await pool.query(
            `SELECT * FROM menus ORDER BY created_at DESC`
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Error fetching menus:", error);
        return NextResponse.json(
            { error: "Failed to fetch menus" },
            { status: 500 }
        );
    }
}

// POST: Create a new menu
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, category, price, description, image_url } = body;

        // Basic input validation
        if (!name || price === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: name and price" },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `INSERT INTO menus (name, category, price, description, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, category, price, description, image_url]
        );
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error("Error creating menu:", error);
        return NextResponse.json(
            { error: "Failed to create menu" },
            { status: 500 }
        );
    }
}
