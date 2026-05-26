import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const products = new Hono()

// GET /products — list with filters and pagination
products.get('/', async (c) => {
  try {
    const { category, search, featured, page = '1', limit = '20', sort = 'created_at' } = c.req.query()

    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const offset = (pageNum - 1) * limitNum

    let query = supabase
      .from('products')
      .select('*, categories(id, name, slug)', { count: 'exact' })
      .eq('is_active', true)

    if (category) query = query.eq('category_id', category)
    if (featured === 'true') query = query.eq('is_featured', true)
    if (search) query = query.ilike('name', `%${search}%`)

    // Sort support: price_asc, price_desc, name, created_at (default)
    const sortMap = {
      price_asc: { col: 'price', asc: true },
      price_desc: { col: 'price', asc: false },
      name: { col: 'name', asc: true },
      created_at: { col: 'created_at', asc: false },
    }
    const sortOpt = sortMap[sort] || sortMap.created_at
    query = query.order(sortOpt.col, { ascending: sortOpt.asc })

    query = query.range(offset, offset + limitNum - 1)

    const { data, error, count } = await query
    if (error) throw error

    return c.json({
      success: true,
      data,
      meta: {
        total: count,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(count / limitNum),
      },
    })
  } catch (err) {
    console.error('GET /products error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /products/:slug — single product by slug
products.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !data) return c.json({ success: false, message: 'Product not found' }, 404)

    return c.json({ success: true, data })
  } catch (err) {
    console.error('GET /products/:slug error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /products — create (admin only)
products.post('/', authenticate, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { name, slug, description, price, compare_price, category_id, images, stock, sku, tags, variants, is_featured } = body

    if (!name || !slug || price === undefined) {
      return c.json({ success: false, message: 'name, slug, and price are required' }, 400)
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description,
        price,
        compare_price,
        category_id,
        images: images || [],
        stock: stock ?? 0,
        sku,
        tags: tags || [],
        variants: variants || [],
        is_featured: is_featured ?? false,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data }, 201)
  } catch (err) {
    console.error('POST /products error:', err)
    if (err.code === '23505') return c.json({ success: false, message: 'Slug or SKU already exists' }, 409)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// PUT /products/:id — update (admin)
products.put('/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    // Remove id from body to avoid conflicts
    delete body.id

    const { data, error } = await supabase
      .from('products')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return c.json({ success: false, message: 'Product not found' }, 404)

    return c.json({ success: true, data })
  } catch (err) {
    console.error('PUT /products/:id error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// DELETE /products/:id — soft delete (admin, set is_active=false)
products.delete('/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')

    const { data, error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return c.json({ success: false, message: 'Product not found' }, 404)

    return c.json({ success: true, message: 'Product deactivated' })
  } catch (err) {
    console.error('DELETE /products/:id error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default products
