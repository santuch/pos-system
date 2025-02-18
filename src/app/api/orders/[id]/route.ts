import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    try {
        const { status } = await req.json();
        const allowedStatuses = [
            "in-progress",
            "ready",
            "waiting-for-payment",
            "paid",
            "cancelled",
        ];
        if (!allowedStatuses.includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }
        const result = await pool.query(
            `UPDATE orders 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *;`,
            [status, id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({
            message: "Order status updated",
            order: result.rows[0],
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json(
            { error: "Failed to update order status" },
            { status: 500 }
        );
    }
}
