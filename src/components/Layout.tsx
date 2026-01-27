import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Map, BookOpen, User, Shield, Radio, Volume2, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Layout() {
    const navigate = useNavigate();
    const [loggingOut, setLoggingOut] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    React.useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('players').select('role').eq('id', user.id).single();
                if (data && data.role === 'Admin') {
                    setIsAdmin(true);
                }
            }
        };
        checkRole();
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        await supabase.auth.signOut();
        navigate('/login');
        setLoggingOut(false);
    };

    return (
        <div className="flex h-screen w-screen bg-transparent font-sans overflow-hidden p-4 lg:p-6 gap-6 relative">

            {/* Atmospheric Overlay: Sunlight Caustics & Particles */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-wave-slow opacity-30 bg-[radial-gradient(circle,rgba(56,189,248,0.4)_0%,transparent_60%)] mix-blend-overlay"></div>
                {/* Floating Bubbles/Particles can be added here */}
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-[#020617] to-transparent opacity-80"></div>
            </div>

            {/* Navigation: The Marine Pillar */}
            <nav className="hidden lg:flex flex-col w-72 h-full marine-dock p-8 justify-between z-50 transition-all duration-500 hover:shadow-sky-500/10">
                <div className="flex flex-col gap-12">
                    {/* Logo - Glowing & Premium */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg shadow-ocean-light/20 animate-pulse-slow overflow-hidden">
                            <img src="/w_hiro-logo.png" alt="Hiro Marine Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-xl tracking-tight text-white drop-shadow-md">
                                Hiro Marine
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.25em] text-ocean-light font-bold">
                                Blue Shield
                            </span>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="flex flex-col gap-2">
                        <NavItem to="/" icon={<Map size={20} />} label="Coastal Feed" />
                        <NavItem to="/missions" icon={<Shield size={20} />} label="Missions" />
                        <NavItem to="/encyclopedia" icon={<BookOpen size={20} />} label="Encyclopedia" />
                        <NavItem to="/community" icon={<Radio size={20} />} label="Community" />
                        <NavItem to="/profile" icon={<User size={20} />} label="Operative" />
                        {isAdmin && (
                            <NavItem to="/admin" icon={<Shield size={20} className="text-alert-red" />} label="Command" />
                        )}
                        <NavItem to="/about" icon={<BookOpen size={20} className="text-slate-500" />} label="System Manual" />
                    </div>
                </div>

                {/* Footer Actions: Audio & Logout */}
                <div className="mt-auto space-y-4">
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:bg-white/10 hover:text-white transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                        {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                        Disengage
                    </button>

                    <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-3 backdrop-blur-md shadow-inner cursor-pointer group hover:bg-black/30">
                        <div className="p-2 bg-ocean-light/10 rounded-full text-ocean-light group-hover:scale-110 transition-transform">
                            <Volume2 size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Soundscape</span>
                            <span className="text-xs font-bold text-ocean-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse"></span>
                                Pantura - Deep
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-900/90 backdrop-blur-2xl border-t border-white/10 z-50 flex items-center justify-around px-4 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.5)]">
                <NavItemMobile to="/" icon={<Map size={24} />} />
                <NavItemMobile to="/missions" icon={<Shield size={24} />} />
                <NavItemMobile to="/encyclopedia" icon={<BookOpen size={24} />} />
                <NavItemMobile to="/community" icon={<Radio size={24} />} />
                <NavItemMobile to="/profile" icon={<User size={24} />} />
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden h-full rounded-3xl marine-dock shadow-none bg-slate-900/50 border-white/5 z-10 box-border">
                <div className="w-full h-full overflow-hidden relative">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function NavItem({ to, icon, label, className }: { to: string; icon: React.ReactNode; label: string; className?: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${className} ${isActive
                    ? 'text-white font-bold shadow-lg shadow-sky-900/20 translate-x-2 bg-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    {/* Active Indicator Background */}
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-ocean-light to-blue-500"></div>}

                    <div className="relative z-10 flex items-center gap-4">
                        <span className={`transition-transform duration-300 ${isActive ? 'text-ocean-light scale-110' : 'group-hover:scale-110 group-hover:text-ocean-medium'}`}>{icon}</span>
                        <span className="tracking-wide text-sm">{label}</span>
                    </div>
                </>
            )}
        </NavLink>
    );
}

function NavItemMobile({ to, icon }: { to: string; icon: React.ReactNode }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `p-4 rounded-full transition-all duration-300 ${isActive
                    ? 'text-white bg-white/10 translate-y-[-5px] shadow-lg shadow-sky-500/20'
                    : 'text-slate-500'
                }`
            }
        >
            {icon}
        </NavLink>
    );
}
