// app/api/verify/route.ts
import { NextResponse } from 'next/server';
import { lookupRegNo } from '../../../lib/sebi';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { regNo } = body;
    if (!regNo)
      return NextResponse.json({ error: 'regNo required' }, { status: 400 });

    const record = await lookupRegNo(regNo);
    const verified = Boolean(record);
    return NextResponse.json({ verified, record });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
