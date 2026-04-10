import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, Users, FileText, LogOut, Settings, FolderOpen, DownloadCloud, Menu, X, BarChart2, RefreshCw } from 'lucide-react';

export default function Layout({ children }) {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="app">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="logo">🚀 Recovery CRM</div>
                <nav>
                    <NavLink to="/" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </NavLink>
                    <NavLink to="/leads" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <FileText size={20} /> Leads
                    </NavLink>
                    {isAdmin && (
                        <>
                            <NavLink to="/users" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Users size={20} /> Vendedoras
                            </NavLink>
                            <NavLink to="/campaigns" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <FolderOpen size={20} /> Campanhas
                            </NavLink>
                            <NavLink to="/groups" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Users size={20} /> Grupos
                            </NavLink>

                            <NavLink to="/analytics" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <BarChart2 size={20} /> Analytics UTM
                            </NavLink>
                            <NavLink to="/recorrencias" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <RefreshCw size={20} /> Recorrências
                            </NavLink>
                            <NavLink to="/settings" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Settings size={20} /> Configurações
                            </NavLink>
                        </>
                    )}
                    {!isAdmin && (
                        <NavLink to="/my-settings" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Settings size={20} /> Configurações
                        </NavLink>
                    )}
                </nav>
                <div className="user-info">
                    <div className="user-name">{user?.name}</div>
                    <div className="user-role">{user?.role === 'admin' ? 'Administrador' : 'Vendedora'}</div>
                    <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%' }}>
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </aside>
            <main className="main-content">{children}</main>
        </div>
    );
}
