import { NextResponse } from "next/server";
import pool from "@/lib/db"; // PostgreSQL connection

// GET - Fetch all menu items
export async function GET() {
    try {
        const result = await pool.query(
            "SELECT * FROM menus ORDER BY created_at DESC"
        );

        // Convert price to a number before sending to frontend
        const formattedData = result.rows.map((row) => ({
            ...row,
            price: Number(row.price),
        }));

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error("Error fetching menu items:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST - Create a new menu item
export async function POST(req: Request) {
    try {
        const { name, category, price, description, image_url } =
            await req.json();

        if (!name || !category || !price || !image_url) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const query = `
            INSERT INTO menus (name, category, price, description, image_url) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const values = [name, category, price, description, image_url];

        const result = await pool.query(query, values);
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error("Error inserting menu item:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
