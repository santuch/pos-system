
import pool from "@/lib/db";
import { 
    notFoundResponse, 
    badRequestResponse,
    handleApiRequest
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// Allowed order statuses
const ALLOWED_STATUSES = [
    "in-progress",
    "ready",
    "waiting-for-payment",
    "paid",
    "cancelled",
];

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    return handleApiRequest(async () => {
        const { id } = params;
        const body = await req.json();
        
        // Validate required fields
        if (!body.status) {
            return badRequestResponse('Missing required field: status');
        }
        
        const { status } = body;
        
        // Validate status is allowed
        if (!ALLOWED_STATUSES.includes(status)) {
            return badRequestResponse(`Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}`);
        }
        
        const result = await pool.query(
            `UPDATE orders 
            SET status = $1, updated_at = NOW() 
            WHERE id = $2 
            RETURNING *;`,
            [status, id]
        );
        
        if (result.rows.length === 0) {
            return notFoundResponse('Order');
        }
        
        return {
            message: "Order status updated",
            order: result.rows[0]
        };
    }, "Error updating order status");
}
