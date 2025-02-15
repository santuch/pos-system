// Example: app/api/ingredients/route.ts or pages/api/ingredients/index.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
    try {
        const result = await pool.query("SELECT * FROM ingredients");
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Error fetching ingredients:", error);
        return NextResponse.json(
            { error: "Failed to fetch ingredients" },
            { status: 500 }
        );
    }
}
