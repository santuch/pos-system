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

// GET: Fetch a single order (with items) by ID
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    const { id } = params;
    try {
        const query = `
            SELECT
                o.id,
                o.table_number,
                o.number_of_customers,
                o.total_price,
                o.status,
                o.created_at,
                o.updated_at,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', oi.id,
                            'name', m.name,
                            'price', oi.price_at_order,
                            'quantity', oi.quantity
                        )
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'
                ) AS items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN menus m ON oi.menu_item_id = m.id
            WHERE o.id = $1
            GROUP BY o.id
            LIMIT 1;
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return notFoundResponse('Order');
        }
        return new Response(JSON.stringify(result.rows[0]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch order' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
): Promise<Response> {
    const params = await context.params;
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
