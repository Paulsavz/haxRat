'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

/**
 * POST /cart/validate
 * Validate cart items — check stock availability and current prices.
 */
router.post('/validate', authenticate, async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError('items array is required');
    }

    const productIds = items.map((i) => i.product_id);
    const { data: products, error: dbError } = await supabase
      .from('products')
      .select('id, name, slug, price, stock_quantity, is_active, images')
      .in('id', productIds);

    if (dbError) throw dbError;

    const productMap = {};
    for (const p of products || []) {
      productMap[p.id] = p;
    }

    const validatedItems = [];
    const issues = [];

    for (const item of items) {
      const product = productMap[item.product_id];
      const qty = parseInt(item.quantity, 10) || 0;

      if (!product) {
        issues.push({
          product_id: item.product_id,
          issue: 'not_found',
          message: 'Product not found or no longer available',
        });
        continue;
      }

      if (!product.is_active) {
        issues.push({
          product_id: item.product_id,
          name: product.name,
          issue: 'unavailable',
          message: `"${product.name}" is no longer available`,
        });
        continue;
      }

      if (qty < 1) {
        issues.push({
          product_id: item.product_id,
          name: product.name,
          issue: 'invalid_quantity',
          message: 'Quantity must be at least 1',
        });
        continue;
      }

      const itemIssues = [];
      let adjustedQty = qty;

      // Check price change
      const priceChanged = item.unit_price !== undefined && Math.abs(item.unit_price - product.price) > 0.001;
      if (priceChanged) {
        itemIssues.push({
          type: 'price_changed',
          message: `Price changed from ${item.unit_price} to ${product.price}`,
          old_price: item.unit_price,
          new_price: product.price,
        });
      }

      // Check stock
      if (product.stock_quantity === 0) {
        issues.push({
          product_id: item.product_id,
          name: product.name,
          issue: 'out_of_stock',
          message: `"${product.name}" is out of stock`,
        });
        continue;
      }

      if (product.stock_quantity < qty) {
        adjustedQty = product.stock_quantity;
        itemIssues.push({
          type: 'quantity_adjusted',
          message: `Only ${product.stock_quantity} unit(s) available. Quantity adjusted.`,
          requested: qty,
          available: product.stock_quantity,
        });
      }

      validatedItems.push({
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        images: product.images,
        unit_price: product.price,
        quantity: adjustedQty,
        total_price: product.price * adjustedQty,
        available_stock: product.stock_quantity,
        issues: itemIssues.length > 0 ? itemIssues : undefined,
      });
    }

    const subtotal = validatedItems.reduce((sum, i) => sum + i.total_price, 0);

    return success(res, {
      valid_items: validatedItems,
      issues,
      subtotal,
      is_valid: issues.length === 0,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /cart/apply-coupon
 * Validate a coupon code and return discount details.
 */
router.post('/apply-coupon', authenticate, async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) throw new ValidationError('coupon code is required');
    if (subtotal === undefined || subtotal === null) {
      throw new ValidationError('subtotal is required to validate coupon');
    }

    const orderSubtotal = parseFloat(subtotal);
    if (isNaN(orderSubtotal) || orderSubtotal < 0) {
      throw new ValidationError('Invalid subtotal value');
    }

    const now = new Date().toISOString();

    const { data: coupon, error: dbError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .lte('starts_at', now)
      .single();

    if (dbError || !coupon) {
      return error(res, 'Invalid or expired coupon code', 400);
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return error(res, 'This coupon has expired', 400);
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return error(res, 'This coupon has reached its usage limit', 400);
    }

    // Check minimum order amount
    if (coupon.minimum_order_amount && orderSubtotal < coupon.minimum_order_amount) {
      return error(
        res,
        `Minimum order amount of ${coupon.minimum_order_amount} required for this coupon`,
        400
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (orderSubtotal * coupon.value) / 100;
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, orderSubtotal);
    } else if (coupon.type === 'free_delivery') {
      discountAmount = 0; // Applied at delivery level
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const newTotal = Math.max(0, orderSubtotal - discountAmount);

    return success(res, {
      coupon_id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount_amount: discountAmount,
      new_total: newTotal,
      description: coupon.description || null,
      free_delivery: coupon.type === 'free_delivery',
    }, 'Coupon applied successfully');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
