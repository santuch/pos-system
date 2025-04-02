import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    const { id } = params;
    try {
        const {
            code,
            discount_type,
            discount_value,
            start_date,
            expiration_date,
            max_uses,
        } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: "Missing id parameter" },
                { status: 400 }
            );
        }

        if (!code || !discount_type || !discount_value || !expiration_date) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const query = `
      UPDATE coupons
      SET code = $1,
          discount_type = $2,
          discount_value = $3,
          start_date = $4,
          expiration_date = $5,
          max_uses = $6
      WHERE id = $7
      RETURNING *
    `;
        const result = await pool.query(query, [
            code,
            discount_type,
            discount_value,
            start_date,
            expiration_date,
            max_uses,
            id,
        ]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Coupon not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error) {
        console.error("Error updating coupon:", error);
        return NextResponse.json(
            { error: "Failed to update coupon" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    const { id } = params;
    try {
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
