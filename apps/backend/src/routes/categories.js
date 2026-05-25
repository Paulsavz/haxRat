'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * GET /categories
 * List all active categories.
 */
router.get('/', async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, display_order, is_active, created_at')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (dbError) throw dbError;

    return success(res, data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /categories
 * Create a category (admin only).
 */
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, slug, description, image_url, display_order } = req.body;

    if (!name || !slug) {
      throw new ValidationError('name and slug are required');
    }

    const { data, error: dbError } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description: description || null,
        image_url: image_url || null,
        display_order: display_order !== undefined ? parseInt(display_order, 10) : 0,
        is_active: true,
      })
      .select()
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
        return error(res, 'A category with this slug already exists', 409);
      }
      throw dbError;
    }

    return success(res, data, 'Category created', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /categories/:id
 * Update a category (admin only).
 */
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = ['name', 'slug', 'description', 'image_url', 'display_order', 'is_active'];

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
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (dbError) throw dbError;
    if (!data) throw new NotFoundError('Category not found');

    return success(res, data, 'Category updated');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /categories/:id
 * Delete a category (admin only).
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if any products are using this category
    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('is_active', true);

    if (countError) throw countError;

    if (count && count > 0) {
      return error(res, `Cannot delete category with ${count} active product(s). Reassign products first.`, 409);
    }

    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return success(res, null, 'Category deleted');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
