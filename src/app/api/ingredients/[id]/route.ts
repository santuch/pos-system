import pool from "@/lib/db";
import { 
    notFoundResponse, 
    badRequestResponse,
    validateRequiredFields,
    handleApiRequest,
    withTransaction
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// GET: Retrieve a specific ingredient by ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        // Validate required fields
        const requiredFields = ['name', 'quantity', 'unit', 'threshold'];
        const missingField = validateRequiredFields(body, requiredFields);
        if (missingField) {
            return badRequestResponse(missingField);
        }
        
        const { name, quantity, unit, threshold } = body;
        
        const result = await pool.query(
            `SELECT * FROM ingredients WHERE id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Ingredient not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("Error retrieving ingredient:", error);
        return NextResponse.json(
            { error: "Failed to retrieve ingredient" },
            { status: 500 }
        );
    }
}

// PUT: Update an ingredient by ID
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        // Validate required fields
        const requiredFields = ['name', 'quantity', 'unit', 'threshold'];
        const missingField = validateRequiredFields(body, requiredFields);
        if (missingField) {
            return badRequestResponse(missingField);
        }
        
        const { name, quantity, unit, threshold } = body;
        const result = await pool.query(
            `UPDATE ingredients
            SET name = $1, quantity = $2, unit = $3, threshold = $4, updated_at = NOW()
            WHERE id = $5 RETURNING *`,
            [name, quantity, unit, threshold, id]
        );
        
        if (result.rows.length === 0) {
            return notFoundResponse('Ingredient');
        }
        
        return {
            message: "Ingredient updated successfully",
            ingredient: result.rows[0]
        };
    }, "Error updating ingredient");
}

// DELETE: Remove an ingredient by ID
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
): Promise<Response> {
    const params = await context.params;
    return handleApiRequest(async () => {
        const { id } = params;
        
        return await withTransaction(async (client) => {
            // Check if ingredient exists
            const ingredientCheck = await client.query(
                'SELECT id FROM ingredients WHERE id = $1',
                [id]
            );
            
            if (ingredientCheck.rows.length === 0) {
                return notFoundResponse('Ingredient');
            }
            
            // Check if ingredient is used in any menu items
            const usageCheck = await client.query(
                'SELECT COUNT(*) as count FROM menu_item_ingredients WHERE ingredient_id = $1',
                [id]
            );
            
            if (parseInt(usageCheck.rows[0].count) > 0) {
                return badRequestResponse('Cannot delete ingredient that is used in menu items');
            }
            
            // Delete the ingredient
            await client.query(
                `DELETE FROM ingredients WHERE id = $1`,
                [id]
            );
            
            return { message: "Ingredient deleted successfully" };
        });
    }, "Error deleting ingredient");
}

// PATCH: Update stock (add stock) for an ingredient by ID
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
): Promise<Response> {
    const params = await context.params;
    return handleApiRequest(async () => {
        const { id } = params;
        const body = await request.json();
        
        // Validate required fields
        if (body.amount === undefined) {
            return badRequestResponse('Missing required field: amount');
        }
        
        const { amount } = body;
        
        // Validate amount is a number
        if (isNaN(Number(amount))) {
            return badRequestResponse('Amount must be a number');
        }
        
        const result = await pool.query(
            `UPDATE ingredients
            SET quantity = quantity + $1, updated_at = NOW()
            WHERE id = $2 RETURNING *`,
            [amount, id]
        );
        
        if (result.rows.length === 0) {
            return notFoundResponse('Ingredient');
        }
        
        return {
            message: "Ingredient stock updated successfully",
            ingredient: result.rows[0]
        };
    }, "Error updating ingredient stock");
}

// GET: Retrieve a single ingredient
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
): Promise<Response> {
    const params = await context.params;
    return handleApiRequest(async () => {
        const { id } = params;
        
        const result = await pool.query(
            `SELECT * FROM ingredients WHERE id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return notFoundResponse('Ingredient');
        }
        
        return result.rows[0];
    }, "Error retrieving ingredient");
}
