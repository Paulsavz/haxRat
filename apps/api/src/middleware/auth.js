import { supabase } from '../lib/supabase.js'

export async function authenticate(c, next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Missing token' }, 401)
  }
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return c.json({ success: false, message: 'Invalid token' }, 401)

  // Fetch profile from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  c.set('user', profile || { id: user.id, email: user.email, role: 'customer' })
  await next()
}

export async function requireAdmin(c, next) {
  const user = c.get('user')
  if (!['admin', 'support'].includes(user?.role)) {
    return c.json({ success: false, message: 'Forbidden' }, 403)
  }
  await next()
}
