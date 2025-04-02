import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
    try {
        const query = `
      SELECT * FROM coupons
      ORDER BY created_at DESC
    `;
        const result = await pool.query(query);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Error fetching coupons:", error);
        return NextResponse.json(
            { error: "Failed to fetch coupons" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const {
            code,
            discount_type,
            discount_value,
            start_date,
            expiration_date,
            max_uses,
        } = await request.json();

        if (!code || !discount_type || !discount_value || !expiration_date) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const query = `
      INSERT INTO coupons (code, discount_type, discount_value, start_date, expiration_date, max_uses)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const result = await pool.query(query, [
            code,
            discount_type,
            discount_value,
            start_date,
            expiration_date,
            max_uses,
        ]);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error("Error creating coupon:", error);
        return NextResponse.json(
            { error: "Failed to create coupon" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        if (!id) {
            return NextResponse.json(
                { error: "Missing id parameter" },
                { status: 400 }
            );
        }

        const query = `
      DELETE FROM coupons
      WHERE id = $1
    `;

        await pool.query(query, [id]);

        return NextResponse.json({ message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        return NextResponse.json(
            { error: "Failed to delete coupon" },
            { status: 500 }
        );
    }
}
