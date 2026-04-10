import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Users from './pages/Users';
import Settings from './pages/Settings';
import SellerSettings from './pages/SellerSettings';
import Campaigns from './pages/Campaigns';
import Groups from './pages/Groups';
import WappiImport from './pages/WappiImport';
import UtmDashboard from './pages/UtmDashboard';
import InstallmentsDashboard from './pages/InstallmentsDashboard';
import Layout from './components/Layout';

function PrivateRoute({ children, adminOnly = false }) {
    const { user, loading, isAdmin } = useAuth();
    if (loading) return <div className="login-container"><div className="card">Carregando...</div></div>;
    if (!user) return <Navigate to="/login" />;
    if (adminOnly && !isAdmin) return <Navigate to="/" />;
    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
                    <Route path="/leads" element={<PrivateRoute><Layout><Leads /></Layout></PrivateRoute>} />
                    <Route path="/users" element={<PrivateRoute adminOnly><Layout><Users /></Layout></PrivateRoute>} />
                    <Route path="/campaigns" element={<PrivateRoute adminOnly><Layout><Campaigns /></Layout></PrivateRoute>} />
                    <Route path="/settings" element={<PrivateRoute adminOnly><Layout><Settings /></Layout></PrivateRoute>} />
                    <Route path="/my-settings" element={<PrivateRoute><Layout><SellerSettings /></Layout></PrivateRoute>} />
                    <Route path="/groups" element={<PrivateRoute adminOnly><Layout><Groups /></Layout></PrivateRoute>} />
                    <Route path="/wappi-groups" element={<PrivateRoute adminOnly><Layout><WappiImport /></Layout></PrivateRoute>} />
                    <Route path="/analytics" element={<PrivateRoute adminOnly><Layout><UtmDashboard /></Layout></PrivateRoute>} />
                    <Route path="/recorrencias" element={<PrivateRoute adminOnly><Layout><InstallmentsDashboard /></Layout></PrivateRoute>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
