// app/api/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  try {
    // ── 1. Verify the user is authenticated ──────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // ── 2. Use service role to delete everything ──────────────────────────
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Null out business ownership (keeps the listing claimable)
    await admin.from('businesses')
      .update({ owner_id: null })
      .eq('owner_id', user.id)

    // Delete all user data (cascade handles the rest if FK is set up)
    await admin.from('reviews')          .delete().eq('user_id', user.id)
    await admin.from('business_claims')  .delete().eq('user_id', user.id)
    await admin.from('saved_businesses') .delete().eq('user_id', user.id)
    await admin.from('product_likes')    .delete().eq('user_id', user.id)
    await admin.from('product_ratings')  .delete().eq('user_id', user.id)
    await admin.from('product_reviews')  .delete().eq('user_id', user.id)
    await admin.from('claim_otps')       .delete().eq('user_id', user.id)
    await admin.from('profiles')         .delete().eq('id', user.id)

    // ── 3. Delete the auth user ───────────────────────────────────────────
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('[delete-account]', deleteError.message)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[delete-account]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}