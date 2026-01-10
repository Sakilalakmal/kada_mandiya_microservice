import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { authApi } from '../api/authApi';
import type { User } from '../types/auth.types';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/tokenStorage';

type AuthState = {
  user: User | null;
  isHydrating: boolean;
};

const initialState: AuthState = {
  user: null,
  isHydrating: true,
};

export const hydrateAuth = createAsyncThunk<User | null>('auth/hydrateAuth', async (_, thunkApi) => {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();

  if (!accessToken) return null;
  if (!refreshToken) {
    await setTokens({ accessToken, refreshToken: accessToken });
  }

  try {
    const me = await thunkApi.dispatch(authApi.endpoints.me.initiate()).unwrap();
    return { id: me.payload.sub, email: me.payload.email, roles: me.payload.roles };
  } catch {
    await clearTokens();
    return null;
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.isHydrating = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(hydrateAuth.pending, (state) => {
      state.isHydrating = true;
    });
    builder.addCase(hydrateAuth.fulfilled, (state, action) => {
      state.isHydrating = false;
      state.user = action.payload;
    });
    builder.addCase(hydrateAuth.rejected, (state) => {
      state.isHydrating = false;
      state.user = null;
    });
  },
});

export const { setUser, clearAuth } = authSlice.actions;
export const authReducer = authSlice.reducer;

