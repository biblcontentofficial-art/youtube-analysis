import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPaypleToken } from '@/lib/payple'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const token = await getPaypleToken()
    return NextResponse.json(token)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
