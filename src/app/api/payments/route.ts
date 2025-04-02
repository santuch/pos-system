import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { orderId, paymentMethod, paymentStatus } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Missing required field: orderId" },
        { status: 400 }
      );
    }
    
    // Insert payment record
    await pool.query(
      `INSERT INTO payments (order_id, payment_method, payment_status)
       VALUES ($1, $2, $3)`,
      [orderId, paymentMethod || "cash", paymentStatus || "succeeded"]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating payment record:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
