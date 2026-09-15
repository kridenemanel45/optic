import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  totalItems: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantite += action.payload.quantite || 1;
      } else {
        state.items.push({ ...action.payload, quantite: action.payload.quantite || 1 });
      }
      state.totalItems = state.items.reduce((total, item) => total + item.quantite, 0);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.totalItems = state.items.reduce((total, item) => total + item.quantite, 0);
    },
    updateQuantity: (state, action) => {
      const { id, quantite } = action.payload;
      const item = state.items.find(i => i.id === id);
      if (item) {
        if (quantite <= 0) {
          state.items = state.items.filter(i => i.id !== id);
        } else {
          item.quantite = quantite;
        }
      }
      state.totalItems = state.items.reduce((total, item) => total + item.quantite, 0);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
    },
    updateBackendCart: (state, action) => {
      state.items = action.payload;
      state.totalItems = state.items.reduce((total, item) => total + item.quantite, 0);
    }
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart, 
  updateBackendCart 
} = cartSlice.actions;

export default cartSlice.reducer;