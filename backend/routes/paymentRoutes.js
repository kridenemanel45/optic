
const express = require('express');
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Le panier est vide" });
    }

    const line_items = items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.title || item.name || item.nom || "Article",
        },
        unit_amount: Math.round(
          Number(item.price || item.prix || 0) * 100
        ),
      },
      quantity: Number(item.quantity || item.quantite || 1),
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',

      success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/cart`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Erreur Stripe détaillée:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

