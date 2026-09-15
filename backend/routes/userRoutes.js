const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Inscription basique (isApproved sera false par défaut grâce au modèle)
router.post('/register', async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Cet email est déjà utilisé." });

    const newUser = new User({ nom, email, password });
    await newUser.save();
    res.status(201).json({ 
      message: "Compte créé avec succès. En attente d'approbation par l'administrateur.", 
      user: { id: newUser._id, nom: newUser.nom, email: newUser.email, isApproved: newUser.isApproved } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Connexion avec vérification de l'approbation
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(400).json({ message: "Identifiants invalides." });

    // VÉRIFICATION DE L'APPROBATION (sauf si c'est un admin)
    if (user.role !== 'admin' && !user.isApproved) {
      return res.status(403).json({ 
        message: "Votre compte est en attente d'approbation par l'administrateur." 
      });
    }

    res.json({ 
      message: "Connexion réussie", 
      user: { 
        id: user._id, 
        nom: user.nom, 
        email: user.email, 
        role: user.role, 
        isApproved: user.isApproved,
        isAdmin: user.role === 'admin' 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route admin : Récupérer tous les utilisateurs (pour voir les non-approuvés)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route admin : Approuver un utilisateur
router.put('/approve/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id); // Correction : utilisation directe de req.params.id
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    user.isApproved = true;
    await user.save();

    res.json({ message: "Utilisateur approuvé avec succès", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

});

module.exports = router;