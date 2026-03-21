import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import PipelineDetail from './pages/PipelineDetail';
import NewItem from './pages/NewItem';
import BuildHistory from './pages/BuildHistory';
import ManageNodes from './pages/ManageNodes';
import FreestyleConfig from './pages/FreestyleConfig';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><Layout><NewItem /></Layout></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><Layout><BuildHistory /></Layout></ProtectedRoute>} />
          <Route path="/nodes" element={<ProtectedRoute><Layout><ManageNodes /></Layout></ProtectedRoute>} />
          <Route path="/project/:id" element={<ProtectedRoute><Layout><ProjectDetail /></Layout></ProtectedRoute>} />
          <Route path="/project/:id/configure" element={<ProtectedRoute><Layout><FreestyleConfig /></Layout></ProtectedRoute>} />
          <Route path="/pipeline/:id" element={<ProtectedRoute><Layout><PipelineDetail /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
