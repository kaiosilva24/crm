import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Lock, Mail, Download } from 'lucide-react';
import { useEffect } from 'react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [installPrompt, setInstallPrompt] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            console.log('👋 PWA: Evento beforeinstallprompt disparado!');
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        console.log('👂 PWA: Ouvindo evento beforeinstallprompt...');

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        setInstallPrompt(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Credenciais inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card slide-up">
                <div className="login-title">
                    <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>🚀 Recovery CRM</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Sistema de Recuperação de Vendas</p>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
                    <div className="form-group">
                        <label className="form-label"><Mail size={14} style={{ marginRight: 6 }} />Email</label>
                        <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label"><Lock size={14} style={{ marginRight: 6 }} />Senha</label>
                        <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                    {installPrompt && (
                        <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ width: '100%', marginTop: 12, border: '1px dashed var(--accent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={handleInstallClick}
                        >
                            <Download size={16} style={{ marginRight: 8 }} />
                            Instalar App no Dispositivo
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
