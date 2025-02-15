import { NextResponse } from "next/server";
import pool from "@/lib/db"; // Ensure you have a correct PostgreSQL connection

export async function POST(req: Request) {
    try {
        const { tableNumber, numberOfCustomers, items, totalPrice } =
            await req.json();

        // Validate required fields
        if (!tableNumber || !numberOfCustomers || !items || !totalPrice) {
            console.error("❌ Missing required fields:", {
                tableNumber,
                numberOfCustomers,
                items,
                totalPrice,
            });
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        console.log("📢 Received Order Data:", {
            tableNumber,
            numberOfCustomers,
            items,
            totalPrice,
        });

        const query = `
            INSERT INTO orders (table_number, number_of_customers, items, total_price) 
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;
        const values = [
            tableNumber,
            numberOfCustomers,
            JSON.stringify(items),
            totalPrice,
        ];

        const result = await pool.query(query, values);
        console.log("✅ Order Saved Successfully:", result.rows[0]);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error("🚨 Error saving order:", error);
        const errMsg = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Internal Server Error", details: errMsg },
            { status: 500 }
        );
    }
}
