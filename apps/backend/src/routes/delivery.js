'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { success } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * GET /delivery/zones
 * List all delivery zones.
 */
router.get('/zones', async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabase
      .from('delivery_zones')
      .select('id, name, regions, fee, estimated_days, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (dbError) throw dbError;

    return success(res, data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /delivery/zones
 * Create a delivery zone (admin only).
 */
router.post('/zones', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, regions, fee, estimated_days, is_active } = req.body;

    if (!name || fee === undefined) {
      throw new ValidationError('name and fee are required');
    }

    const { data, error: dbError } = await supabase
      .from('delivery_zones')
      .insert({
        name,
        regions: regions || [],
        fee: parseFloat(fee),
        estimated_days: estimated_days ? parseInt(estimated_days, 10) : null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return success(res, data, 'Delivery zone created', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /delivery/zones/:id
 * Update a delivery zone (admin only).
 */
router.put('/zones/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = ['name', 'regions', 'fee', 'estimated_days', 'is_active'];

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
      .from('delivery_zones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (dbError) throw dbError;
    if (!data) throw new NotFoundError('Delivery zone not found');

    return success(res, data, 'Delivery zone updated');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /delivery/calculate
 * Calculate the delivery fee for a given address or region.
 */
router.post('/calculate', async (req, res, next) => {
  try {
    const { region, address, zone_id } = req.body;

    if (!region && !address && !zone_id) {
      throw new ValidationError('region, address, or zone_id is required');
    }

    // If zone_id provided directly
    if (zone_id) {
      const { data: zone, error: zoneError } = await supabase
        .from('delivery_zones')
        .select('id, name, fee, estimated_days')
        .eq('id', zone_id)
        .eq('is_active', true)
        .single();

      if (zoneError || !zone) {
        throw new NotFoundError('Delivery zone not found');
      }

      return success(res, {
        zone_id: zone.id,
        zone_name: zone.name,
        fee: zone.fee,
        estimated_days: zone.estimated_days,
      });
    }

    // Search by region name
    const searchTerm = (region || address || '').toLowerCase().trim();

    const { data: zones, error: zonesError } = await supabase
      .from('delivery_zones')
      .select('id, name, regions, fee, estimated_days')
      .eq('is_active', true);

    if (zonesError) throw zonesError;

    let matchedZone = null;

    for (const zone of zones || []) {
      const zoneRegions = Array.isArray(zone.regions)
        ? zone.regions.map((r) => r.toLowerCase())
        : [];

      const isMatch = zoneRegions.some(
        (r) => searchTerm.includes(r) || r.includes(searchTerm)
      );

      if (isMatch) {
        matchedZone = zone;
        break;
      }
    }

    if (!matchedZone) {
      // Return default zone or indicate not covered
      const { data: defaultZone } = await supabase
        .from('delivery_zones')
        .select('id, name, fee, estimated_days')
        .eq('is_active', true)
        .order('fee', { ascending: true })
        .limit(1)
        .maybeSingle();

      return success(res, {
        zone_id: defaultZone?.id || null,
        zone_name: defaultZone?.name || 'Standard Delivery',
        fee: defaultZone?.fee || 0,
        estimated_days: defaultZone?.estimated_days || null,
        is_default: true,
        covered: !!defaultZone,
        message: matchedZone
          ? 'Delivery zone found'
          : 'Your area is not in a specific zone. Standard rates apply.',
      });
    }

    return success(res, {
      zone_id: matchedZone.id,
      zone_name: matchedZone.name,
      fee: matchedZone.fee,
      estimated_days: matchedZone.estimated_days,
      covered: true,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
