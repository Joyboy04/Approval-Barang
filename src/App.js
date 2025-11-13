// src/App.js
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { CSpinner, useColorModes } from '@coreui/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { setUser, clearUser } from './redux/authSlice';
import './scss/style.scss';

// Containers and Pages
const AdminLayout = React.lazy(() => import('./layout/AdminLayout'));
const UserLayout = React.lazy(() => import('./layout/UserLayout'));
const Login = React.lazy(() => import('./views/pages/login/Login'));
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'));
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'));

import PrivateRoute from './utils/PrivateRoute';
import { selectUser } from './redux/authSlice';

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');
  const storedTheme = useSelector((state) => state.ui?.theme || 'light');  
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  
  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const { getDoc, doc } = await import('./firebase');
        const { db } = await import('./firebase');
        
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            dispatch(setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userData.role,
              name: userData.name,
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // User is signed out
        dispatch(clearUser());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1]);
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0];
    if (theme) {
      setColorMode(theme);
    }
    if (isColorModeSet()) {
      return;
    }
    setColorMode(storedTheme);
  }, []);

  return (
    <Router>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/404" element={<Page404 />} />
          <Route path="/500" element={<Page500 />} />

          {/* Protected User Routes */}
          <Route 
            path="/user/*" 
            element={
              <PrivateRoute role="user">
                <UserLayout />
              </PrivateRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              <PrivateRoute role="admin">
                <AdminLayout />
              </PrivateRoute>
            }
          />

          {/* Default Route */}
          <Route
            path="/"
            element={
              user ? (
                user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/user/dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;