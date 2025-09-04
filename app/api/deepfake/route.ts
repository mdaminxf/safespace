import { NextRequest, NextResponse } from "next/server";

// ✅ Only top-level exports should be handlers
export async function POST(req: NextRequest) {
  return NextResponse.json({ message: "Demo deepfake API (mock only)" });
}
