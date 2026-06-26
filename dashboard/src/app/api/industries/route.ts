import { type NextRequest, NextResponse } from "next/server";
import { getIndustries } from "@/lib/data";

export async function GET(_req: NextRequest) {
  const list = getIndustries();
  return NextResponse.json(list);
}
