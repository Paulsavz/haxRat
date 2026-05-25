'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/errors');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new ValidationError('Only image files are allowed'));
    }
    cb(null, true);
  },
});

/**
 * GET /products
 * List products with filters, search and pagination.
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      category,
      search,
      min_price,
      max_price,
      tags,
      featured,
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('products')
      .select(
        `id, name, slug, description, price, compare_price, images, tags,
         is_featured, stock_quantity, is_active, created_at,
         categories(id, name, slug)`,
        { count: 'exact' }
      )
      .eq('is_active', true);

    if (category) {
      // Support both slug and id
      const isUuid = /^[0-9a-f-]{36}$/.test(category);
      if (isUuid) {
        query = query.eq('category_id', category);
      } else {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single();
        if (cat) query = query.eq('category_id', cat.id);
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (min_price !== undefined) {
      query = query.gte('price', parseFloat(min_price));
    }
    if (max_price !== undefined) {
      query = query.lte('price', parseFloat(max_price));
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim());
      query = query.overlaps('tags', tagList);
    }

    if (featured === 'true' || featured === '1') {
      query = query.eq('is_featured', true);
    }

    const allowedSorts = ['created_at', 'price', 'name', 'updated_at'];
    const sortField = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? true : false;

    const { data, count, error: dbError } = await query
      .order(sortField, { ascending: sortOrder })
      .range(offset, offset + limitNum - 1);

    if (dbError) throw dbError;

    return paginated(res, data, count, pageNum, limitNum);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /products/:slug
 * Get a single product by slug.
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabase
      .from('products')
      .select(
        `*, categories(id, name, slug)`
      )
      .eq('slug', req.params.slug)
      .eq('is_active', true)
      .single();

    if (dbError || !data) throw new NotFoundError('Product not found');

    return success(res, data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /products
 * Create a product (admin only).
 */
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      name, slug, description, price, compare_price,
      category_id, images, tags, is_featured,
      stock_quantity, is_active,
    } = req.body;

    if (!name || !slug || price === undefined) {
      throw new ValidationError('name, slug and price are required');
    }

    const { data, error: dbError } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description: description || null,
        price: parseFloat(price),
        compare_price: compare_price ? parseFloat(compare_price) : null,
        category_id: category_id || null,
        images: images || [],
        tags: tags || [],
        is_featured: is_featured || false,
        stock_quantity: parseInt(stock_quantity, 10) || 0,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
        return error(res, 'A product with this slug already exists', 409);
      }
      throw dbError;
    }

    return success(res, data, 'Product created', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /products/:id
 * Update a product (admin only).
 */
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = [
      'name', 'slug', 'description', 'price', 'compare_price',
      'category_id', 'images', 'tags', 'is_featured',
      'stock_quantity', 'is_active',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    updates.updated_at = new Date().toISOString();

    const { data, error: dbError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (dbError) throw dbError;
    if (!data) throw new NotFoundError('Product not found');

    return success(res, data, 'Product updated');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /products/:id
 * Soft-delete a product (admin only).
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (dbError) throw dbError;
    if (!data) throw new NotFoundError('Product not found');

    return success(res, null, 'Product deleted');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /products/:id/images
 * Upload product image to Supabase Storage.
 */
router.post('/:id/images', authenticate, requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) throw new ValidationError('No image file provided');

    const { id } = req.params;
    const ext = req.file.originalname.split('.').pop();
    const fileName = `products/${id}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Append URL to product's images array
    const { data: product } = await supabase
      .from('products')
      .select('images')
      .eq('id', id)
      .single();

    const existingImages = Array.isArray(product?.images) ? product.images : [];
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({
        images: [...existingImages, publicUrl],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return success(res, { url: publicUrl, product: updated }, 'Image uploaded', 201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
