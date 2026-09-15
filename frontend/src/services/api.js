import axios from 'axios';

// Utilise la variable d'environnement de production si elle existe, sinon bascule sur localhost pour les tests locaux
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_URL,
});

// Produits
export const getProducts = () => API.get('/products');
export const getProductById = (id) => API.get(`/products/${id}`);
export const createProduct = (productData) => API.post('/products', productData);
export const updateProductAPI = (id, productData) => API.put(`/products/${id}`, productData);
export const deleteProductAPI = (id) => API.delete(`/products/${id}`);

// Panier
export const getCart = (userId) => API.get(`/cart/${userId}`);
export const saveCart = (userId, items) => API.post(`/cart/${userId}`, { items });

// Utilisateur
export const loginUser = (credentials) => API.post('/users/login', credentials);
export const registerUser = (userData) => API.post('/users/register', userData);

// Contact
export const sendContactMessage = (messageData) => API.post('/contact', messageData);

export default API;