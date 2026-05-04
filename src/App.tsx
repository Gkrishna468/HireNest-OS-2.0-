/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { Sidebar } from './components/Sidebar';
import NotificationHub from './components/NotificationHub';
import OnboardingTour from './components/OnboardingTour';
import { Toaster } from 'sonner';

// Lazy load pages eventually, but for now placeholders or direct imports
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Candidates from './pages/Candidates';
import Clients from './pages/Clients';
import Vendors from './pages/Vendors';
import Resumes from './pages/Resumes';
import Agents from './pages/Agents';
import AIMatching from './pages/AIMatching';
import FollowUps from './pages/FollowUps';
import DealRoom from './pages/DealRoom';
import ExecSuite from './pages/ExecSuite';
import IntelligenceCenter from './pages/IntelligenceCenter';
import EmailCenter from './pages/EmailCenter';
import WhatsAppCenter from './pages/WhatsAppCenter';
import CollaborationHub from './pages/CollaborationHub';
import Marketplace from './pages/Marketplace';
import AgentChat from './pages/AgentChat';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-500 font-medium">Loading HireNest...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <OnboardingTour />
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end mb-6">
            <NotificationHub />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
            <Route path="/candidates" element={<PrivateRoute><Candidates /></PrivateRoute>} />
            <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
            <Route path="/vendors" element={<PrivateRoute><Vendors /></PrivateRoute>} />
            <Route path="/resumes" element={<PrivateRoute><Resumes /></PrivateRoute>} />
            <Route path="/agents" element={<PrivateRoute><Agents /></PrivateRoute>} />
            <Route path="/ai-matching" element={<PrivateRoute><AIMatching /></PrivateRoute>} />
            <Route path="/follow-ups" element={<PrivateRoute><FollowUps /></PrivateRoute>} />
            <Route path="/deal-room" element={<PrivateRoute><DealRoom /></PrivateRoute>} />
            <Route path="/exec-suite" element={<PrivateRoute><ExecSuite /></PrivateRoute>} />
            <Route path="/intelligence" element={<PrivateRoute><IntelligenceCenter /></PrivateRoute>} />
            <Route path="/email" element={<PrivateRoute><EmailCenter /></PrivateRoute>} />
            <Route path="/whatsapp" element={<PrivateRoute><WhatsAppCenter /></PrivateRoute>} />
            <Route path="/marketplace" element={<PrivateRoute><Marketplace /></PrivateRoute>} />
            <Route path="/collaboration" element={<PrivateRoute><CollaborationHub /></PrivateRoute>} />
            <Route path="/agent-chat" element={<PrivateRoute><AgentChat /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}
