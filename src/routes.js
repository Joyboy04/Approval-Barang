// src/routes.js
import AdminDashboard from './views/pages/admin/AdminDashboard';
import UserDashboard from './views/pages/user/UserDashboard';
import Login from './views/pages/login/Login';
import Register from './views/pages/register/Register';
import Page404 from './views/pages/page404/Page404';
import Page500 from './views/pages/page500/Page500';

// Import PrivateRoute for protected routes
import PrivateRoute from './utils/PrivateRoute';

// Define routes for the app
const routes = [
  // Public Routes
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/404', element: <Page404 /> },
  { path: '/500', element: <Page500 /> },

  // Admin Protected Routes
  { 
    path: '/admin', 
    element: <PrivateRoute role="admin" element={<AdminDashboard />} /> 
  },

  // User Protected Routes
  { 
    path: '/user', 
    element: <PrivateRoute role="user" element={<UserDashboard />} /> 
  },

  // Default Route - Redirect based on role
  { 
    path: '/', 
    element: <PrivateRoute role="user" element={<UserDashboard />} /> // default to User Dashboard
  }
];

export default routes;
