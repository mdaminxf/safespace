// app/api/advisers/route.ts
import { NextResponse } from 'next/server';

let IN_MEMORY_ADVISERS: any[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, regNo, bio } = body;
    if (!name || !regNo)
      return NextResponse.json(
        { message: 'name and regNo are required' },
        { status: 400 }
      );

    const id = String(Date.now());
    const adviser = {
      id,
      name,
      regNo,
      bio,
      createdAt: new Date().toISOString(),
    };
    IN_MEMORY_ADVISERS.push(adviser);
    // In production persist to database and trigger verification workflow.
    return NextResponse.json({ ok: true, adviser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'server error' }, { status: 500 });
  }
}

export async function GET() {
  // returns in-memory advisers for demo
  return NextResponse.json({ advisers: IN_MEMORY_ADVISERS });
}
