import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";

// GET /api/products — returns the full product catalog.
export function GET() {
  return NextResponse.json({ products: getAllProducts() });
}
