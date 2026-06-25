import { type NextRequest, NextResponse } from "next/server";
import { getIndustryData, getIndustryMeta } from "@/lib/data";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = getIndustryMeta(id);
  if (!meta) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await getIndustryData(id);
  if (!data) {
    return NextResponse.json({ error: "Data not available" }, { status: 500 });
  }

  return NextResponse.json({ meta, ...data });
}
