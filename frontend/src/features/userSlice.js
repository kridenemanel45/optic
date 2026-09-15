import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser } from '../services/api';

// Action de Connexion
export const login = createAsyncThunk('user/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await loginUser(credentials);
    const user = response.data?.user || response.data;

    // Détermination sécurisée du rôle admin et du statut d'approbation
    const isAdmin = user.role === 'admin'; // Plus propre : ne pas deviner par l'email
    const isApproved = isAdmin || user.isApproved === true || user.status === 'approved';

    return {
      ...user,
      id: user._id || user.id,
      name: user.name || user.nom || credentials.email.split('@')[0],
      email: user.email || credentials.email,
      role: user.role || (isAdmin ? 'admin' : 'user'),
      isAdmin: isAdmin,
      isApproved: isApproved,
    };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Erreur de connexion");
  }
});

// Action d'Inscription
export const register = createAsyncThunk('user/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await registerUser(userData);
    const user = response.data?.user || response.data;

    // Nouveau compte → TOUJOURS en attente d'approbation (sauf admin)
    const isAdmin = user.role === 'admin';
    const isApproved = isAdmin; // Si c'est un admin, approuvé sinon non

    return {
      ...user,
      id: user._id || user.id,
      name: user.name || user.nom || userData.email.split('@')[0],
      email: user.email || userData.email,
      role: user.role || (isAdmin ? 'admin' : 'user'),
      isAdmin: isAdmin,
      isApproved: isApproved,
      status: user.status || 'pending', // stocke aussi le statut côté user
    };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Erreur lors de l'inscription");
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    userInfo: JSON.parse(localStorage.getItem('userInfo')) || null,
    authStatus: localStorage.getItem('authStatus') || 'notConnected',
    status: 'idle',
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.userInfo = null;
      state.authStatus = 'notConnected';
      localStorage.removeItem('userInfo');
      localStorage.removeItem('authStatus');
    },
    // Action manuelle pour mettre à jour le statut (utile pour l'admin)
    updateUserStatus: (state, action) => {
      const { id, isApproved, role } = action.payload;
      if (state.userInfo && state.userInfo.id === id) {
        state.userInfo.isApproved = isApproved;
        state.userInfo.role = role || state.userInfo.role;
        state.userInfo.isAdmin = state.userInfo.role === 'admin' || isApproved;
        state.authStatus = isApproved ? 'approved' : 'pendingApproval';
        localStorage.setItem('userInfo', JSON.stringify(state.userInfo));
        localStorage.setItem('authStatus', state.authStatus);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userInfo = action.payload;
        state.authStatus = action.payload.isApproved ? 'approved' : 'pendingApproval';
        localStorage.setItem('userInfo', JSON.stringify(action.payload));
        localStorage.setItem('authStatus', state.authStatus);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Register
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userInfo = action.payload;
        state.authStatus = action.payload.isApproved ? 'approved' : 'pendingApproval';
        localStorage.setItem('userInfo', JSON.stringify(action.payload));
        localStorage.setItem('authStatus', state.authStatus);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { logout, updateUserStatus } = userSlice.actions;
export default userSlice.reducer;