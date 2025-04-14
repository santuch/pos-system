import { NextResponse } from "next/server";
import { PoolClient } from "pg";
import pool from "@/lib/db";

// Response helper functions
export function successResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function notFoundResponse(entity = "Resource") {
  return NextResponse.json({ error: `${entity} not found` }, { status: 404 });
}

export function badRequestResponse(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

// Database transaction helper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Validation helpers
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

// Error handling wrapper
export async function handleApiRequest<T>(
  requestHandler: () => Promise<T>,
  errorMessage = "Error processing request"
): Promise<NextResponse> {
  try {
    const result = await requestHandler();
    return successResponse(result);
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return errorResponse(
      error instanceof Error ? error.message : errorMessage
    );
  }
}
