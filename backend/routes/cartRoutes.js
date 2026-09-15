const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

router.get('/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate('items.productId');
    res.json(cart || { userId: req.params.userId, items: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:userId', async (req, res) => {
  try {
    const { items } = req.body;
    let cart = await Cart.findOne({ userId: req.params.userId });
    
    if (cart) {
      cart.items = items;
      await cart.save();
    } else {
      cart = new Cart({ userId: req.params.userId, items });
      await cart.save();
    }
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;