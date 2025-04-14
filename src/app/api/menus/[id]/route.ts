// Path: /menus/[id]/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { 
    errorResponse, 
    successResponse, 
    notFoundResponse, 
    withTransaction,
    validateRequiredFields,
    handleApiRequest,
    badRequestResponse
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    return handleApiRequest(async () => {
        const { id } = params;
        const body = await request.json();
        
        // Validate required fields
        const requiredFields = ['name', 'category', 'price', 'description'];
        const missingField = validateRequiredFields(body, requiredFields);
        if (missingField) {
            return badRequestResponse(missingField);
        }
        
        const { name, category, price, description, image_url, ingredients } = body;

        // Perform database operations within a transaction
        return await withTransaction(async (client) => {
            // Check if menu exists
            const menuCheck = await client.query(
                'SELECT id FROM menus WHERE id = $1',
                [id]
            );
            
            if (menuCheck.rows.length === 0) {
                return notFoundResponse('Menu');
            }

            // Update the menu record
            await client.query(
                `UPDATE menus 
                SET name = $1, category = $2, price = $3, description = $4, image_url = $5, updated_at = NOW()
                WHERE id = $6`,
                [name, category, price, description, image_url, id]
            );

            // Remove existing ingredient associations
            await client.query(
                `DELETE FROM menu_item_ingredients WHERE menu_item_id = $1`,
                [id]
            );

            // Process updated ingredients
            if (ingredients && Array.isArray(ingredients)) {
                for (const ingredient of ingredients) {
                    if (!ingredient.name) {
                        continue; // Skip invalid ingredients
                    }
                    
                    const existing = await client.query(
                        `SELECT id FROM ingredients WHERE name = $1`,
                        [ingredient.name]
                    );
                    
                    let ingredientId;
                    if (existing.rows.length > 0) {
                        ingredientId = existing.rows[0].id;
                    } else {
                        const newIngredient = await client.query(
                            `INSERT INTO ingredients (name, unit, quantity, threshold)
                            VALUES ($1, $2, 0, 0) RETURNING id`,
                            [ingredient.name, "unit"]
                        );
                        ingredientId = newIngredient.rows[0].id;
                    }
                    
                    await client.query(
                        `INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, amount_required)
                        VALUES ($1, $2, $3)`,
                        [id, ingredientId, ingredient.amount || 1]
                    );
                }
            }

            // Get updated menu with ingredients
            const updatedMenu = await client.query(
                `SELECT m.*, json_agg(
                    json_build_object(
                        'id', i.id,
                        'name', i.name,
                        'amount', mi.amount_required
                    )
                ) as ingredients
                FROM menus m
                LEFT JOIN menu_item_ingredients mi ON m.id = mi.menu_item_id
                LEFT JOIN ingredients i ON mi.ingredient_id = i.id
                WHERE m.id = $1
                GROUP BY m.id`,
                [id]
            );

            return {
                message: "Menu updated successfully",
                menu: updatedMenu.rows[0]
            };
        });
    }, "Error updating menu");
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    return handleApiRequest(async () => {
        const { id } = params;
        
        return await withTransaction(async (client) => {
            // Check if menu exists
            const menuCheck = await client.query(
                'SELECT id FROM menus WHERE id = $1',
                [id]
            );
            
            if (menuCheck.rows.length === 0) {
                return notFoundResponse('Menu');
            }
            
            // First delete related menu_item_ingredients
            await client.query(
                `DELETE FROM menu_item_ingredients WHERE menu_item_id = $1`,
                [id]
            );
            
            // Then delete the menu
            await client.query(
                `DELETE FROM menus WHERE id = $1`,
                [id]
            );
            
            return { message: "Menu deleted successfully" };
        });
    }, "Error deleting menu");
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    return handleApiRequest(async () => {
        const { id } = params;
        
        const result = await pool.query(
            `SELECT m.*, json_agg(
                json_build_object(
                    'id', i.id,
                    'name', i.name,
                    'amount', mi.amount_required
                )
            ) as ingredients
            FROM menus m
            LEFT JOIN menu_item_ingredients mi ON m.id = mi.menu_item_id
            LEFT JOIN ingredients i ON mi.ingredient_id = i.id
            WHERE m.id = $1
            GROUP BY m.id`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return notFoundResponse('Menu');
        }
        
        return result.rows[0];
    }, "Error retrieving menu");
}
