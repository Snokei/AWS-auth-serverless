const express = require('express');
const itemsDb = require('../db/items');

const router = express.Router();

/**
 * GET /
 * Retrieve list of items (with id, name, description)
 */
router.get('/', async (req, res) => {
  try {
    const items = await itemsDb.getAllItems();
    return res.status(200).json({
      success: true,
      count: items.length,
      items
    });
  } catch (err) {
    console.error('Error fetching items:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch items',
      message: err.message
    });
  }
});

/**
 * GET /:id
 * Retrieve single item by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await itemsDb.getItemById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    return res.status(200).json({
      success: true,
      item
    });
  } catch (err) {
    console.error(`Error fetching item ${req.params.id}:`, err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch item',
      message: err.message
    });
  }
});

/**
 * POST /
 * Create a new item (requires name and description)
 */
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim() || !description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name and description are required'
      });
    }

    const newItem = await itemsDb.createItem({ name, description });

    return res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item: newItem
    });
  } catch (err) {
    console.error('Error creating item:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create item',
      message: err.message
    });
  }
});

/**
 * PUT /:id
 * Update an existing item by ID
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim() || !description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name and description are required'
      });
    }

    const updatedItem = await itemsDb.updateItem(id, { name, description });

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (err) {
    console.error(`Error updating item ${req.params.id}:`, err);
    return res.status(500).json({
      success: false,
      error: 'Failed to update item',
      message: err.message
    });
  }
});

/**
 * DELETE /:id
 * Delete an item by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await itemsDb.deleteItem(id);

    return res.status(200).json({
      success: true,
      message: `Item ${id} deleted successfully`,
      id
    });
  } catch (err) {
    console.error(`Error deleting item ${req.params.id}:`, err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete item',
      message: err.message
    });
  }
});

module.exports = router;
