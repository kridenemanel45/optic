const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');

// ======================================================
// INSCRIPTION
// ======================================================

router.post('/register', async (req, res) => {
  try {
    const { nom, email, password } = req.body;

    if (
      typeof nom !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Données invalides.'
      });
    }

    const cleanNom = nom.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!cleanNom || !normalizedEmail || !password) {
      return res.status(400).json({
        message: 'Veuillez remplir tous les champs.'
      });
    }

    if (cleanNom.length > 100) {
      return res.status(400).json({
        message: 'Le nom est trop long.'
      });
    }

    if (normalizedEmail.length > 254) {
      return res.status(400).json({
        message: 'Email invalide.'
      });
    }

    // Vérification simple du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Adresse email invalide.'
      });
    }

    // Mot de passe minimum
    if (password.length < 8) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères.'
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        message: 'Le mot de passe est trop long.'
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Cet email est déjà utilisé.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // IMPORTANT :
    // Le rôle vient UNIQUEMENT du serveur.
    const newUser = new User({
      nom: cleanNom,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'client',
      isApproved: false
    });

    await newUser.save();

    return res.status(201).json({
      message:
        "Compte créé avec succès. Votre compte est en attente d'approbation par l'administrateur.",
      user: {
        id: newUser._id,
        nom: newUser.nom,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved,
        isAdmin: false
      }
    });

  } catch (err) {
    console.error('❌ Erreur inscription :', err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Cet email est déjà utilisé.'
      });
    }

    return res.status(500).json({
      message: 'Erreur lors de la création du compte.'
    });
  }
});

// ======================================================
// CONNEXION
// ======================================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Email et mot de passe requis.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: 'Email et mot de passe requis.'
      });
    }

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(401).json({
        message: 'Identifiants invalides.'
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: 'Identifiants invalides.'
      });
    }

    // Les clients doivent être approuvés.
    // L'administrateur peut toujours se connecter.
    if (user.role !== 'admin' && !user.isApproved) {
      return res.status(403).json({
        message:
          "Votre compte est en attente d'approbation par l'administrateur."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET est absent.');

      return res.status(500).json({
        message: 'Configuration serveur incorrecte.'
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString()
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    return res.json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        isAdmin: user.role === 'admin',
        token
      }
    });

  } catch (err) {
    console.error('❌ Erreur connexion :', err);

    return res.status(500).json({
      message: 'Erreur lors de la connexion.'
    });
  }
});

// ======================================================
// RÉCUPÉRER TOUS LES UTILISATEURS
// 🔒 ADMIN UNIQUEMENT
// ======================================================

router.get(
  '/users',
  protect,
  admin,
  async (req, res) => {
    try {
      const users = await User
        .find()
        .select('-password')
        .sort({ createdAt: -1 });

      return res.json(users);

    } catch (err) {
      console.error(
        '❌ Erreur récupération utilisateurs :',
        err
      );

      return res.status(500).json({
        message:
          'Erreur lors de la récupération des utilisateurs.'
      });
    }
  }
);

// ======================================================
// APPROUVER UN UTILISATEUR
// 🔒 ADMIN UNIQUEMENT
// ======================================================

router.put(
  '/approve/:id',
  protect,
  admin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: 'Utilisateur non trouvé.'
        });
      }

      if (user.role === 'admin') {
        return res.status(400).json({
          message:
            "Un administrateur n'a pas besoin d'approbation."
        });
      }

      user.isApproved = true;

      await user.save();

      return res.json({
        message: 'Utilisateur approuvé avec succès.',
        user: {
          id: user._id,
          nom: user.nom,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
          isAdmin: false
        }
      });

    } catch (err) {
      console.error(
        '❌ Erreur approbation utilisateur :',
        err
      );

      return res.status(500).json({
        message:
          "Erreur lors de l'approbation de l'utilisateur."
      });
    }
  }
);

module.exports = router;