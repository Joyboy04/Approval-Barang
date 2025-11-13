// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './authSlice';

// Initial state untuk UI
const initialUIState = {
  sidebarShow: true,
  sidebarUnfoldable: false,
  theme: 'light',
}

const uiReducer = (state = initialUIState, action) => {
  switch (action.type) {
    case 'set':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// Persist config untuk auth
const persistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'isAuthenticated']
}

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

// Store
const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
export default store;