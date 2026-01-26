import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Shield, Target, Globe, Heart, AlertTriangle } from 'lucide-react';

export default function Login() {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    // Force clear session on mount
    React.useEffect(() => {
        const ensureLogout = async () => {
            await supabase.auth.signOut();
        };
        ensureLogout();
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (isRegister) {
                if (password !== confirmPassword) {
                    throw new Error("Access Codes (Passwords) do not match");
                }
                if (!username.trim()) {
                    throw new Error("Operative Callsign (Username) is required");
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: username,
                            username: username
                        }
                    }
                });

                if (error) throw error;
                // Note: Trigger in DB will verify player creation, but for immediate login we check session.
                // For a real app, confirm email might be needed.
                if (data.session) {
                    navigate('/');
                } else {
                    // Check if sign in is possible immediately (sometimes signUp auto-signs in)
                    const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
                    if (signInData.session) navigate('/');
                    else {
                        setIsRegister(false);
                        setSuccessMessage("Identity created. Await Clearance (Email Verification) or proceed if disabled.");
                    }
                }
            } else {
                // 1. Authenticate with Auth Provider
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                // 2. STRICT CHECK & SELF-HEALING PROTOCOL
                // Check if user exists in public.players
                const { data: player, error: playerError } = await supabase
                    .from('players')
                    .select('id')
                    .eq('id', data.session.user.id)
                    .single();

                if (playerError || !player) {
                    console.log("Profile missing (DB Reset detected). Initiating Self-Healing...");

                    // Determine Role: If using the prototype admin email, restore Admin status automatically.
                    const restoreRole = email === 'admin@hiro.com' ? 'Admin' : 'User';

                    // Create missing profile
                    const { error: healError } = await supabase.from('players').insert({
                        id: data.session.user.id,
                        name: data.session.user.user_metadata.full_name || username || 'Operative',
                        role: restoreRole,
                        clan: 'Drifters',
                        level: 1,
                        xp: 0
                    });

                    if (healError) {
                        console.error("Self-Healing Failed:", healError);
                        await supabase.auth.signOut();
                        throw new Error("CRITICAL: Database Synchronization Failed. Please clear cookies and retry.");
                    }
                    console.log("Profile restored successfully.");
                }

                // 3. Success
                navigate('/');
            }
        } catch (err: any) {
            console.error("Auth Error:", err);
            if (err.message && err.message.includes('rate limit')) {
                setError("Security Protocol: Rate limit exceeded. Stand by.");
            } else {
                setError(err.message || "Authentication Failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const fillCreds = (type: 'user' | 'admin') => {
        if (type === 'admin') {
            setEmail('admin@hiro.com');
            setPassword('admin123');
        } else {
            setEmail('user@hiro.com');
            setPassword('user123');
        }
    };

    return (
        <div className="flex h-screen w-full bg-slate-950 relative overflow-hidden">
            {/* Real Ocean Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1551244072-5d12893278ab?q=80&w=2070"
                    alt="Deep Ocean"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-blue-900/30 mix-blend-multiply" />
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Split Layout */}
            <div className="relative z-10 w-full h-full flex flex-col lg:flex-row">

                {/* Left Side: Campaign Goals (Info) */}
                <div className="hidden lg:flex flex-1 flex-col justify-center p-16 xl:p-24 text-white">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] overflow-hidden">
                            <img src="/w_hiro-logo.png" alt="Hiro Marine Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-display font-black tracking-tighter mb-1">Hiro Marine</h1>
                            <div className="text-sm font-bold text-cyan-400 uppercase tracking-[0.3em]">Protection Systems</div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-light mb-8 text-slate-300">
                        "Defending the <span className="text-white font-bold">Blue Heart</span> of our planet."
                    </h2>

                    <div className="space-y-6 max-w-lg">
                        <GoalItem
                            icon={<Target />}
                            title="Mission Directives"
                            desc="Execute coastal cleanups and removal of ghost nets in Sector A-4."
                        />
                        <GoalItem
                            icon={<Globe />}
                            title="Biodiversity Tracking"
                            desc="Monitor critical populations: Javan Rhino, Hawksbill Turtle, and Dugong."
                        />
                        <GoalItem
                            icon={<Heart />}
                            title="Community Clans"
                            desc="Mobilize local forces. Earn shells. Rise through the ranks."
                        />
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex-1 flex flex-col justify-center items-center lg:items-start p-6 lg:p-16 overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-2xl">

                        {/* Mobile Header (Only visible on small screens) */}
                        <div className="lg:hidden text-center mb-8">
                            <h1 className="text-3xl font-display font-black text-white">Hiro Marine</h1>
                            <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Mobile Terminal</p>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">{isRegister ? 'Enlistment' : 'Identify Yourself'}</h2>
                            <p className="text-slate-400 text-sm">Enter your credentials to access the Command Center.</p>
                        </div>

                        {/* Prototype Access */}
                        {!isRegister && (
                            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Shield size={12} className="text-amber-400" />
                                    Prototype Auto-Fill
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fillCreds('user')}
                                        className="text-left p-3 rounded-lg hover:bg-white/5 transition-colors group border border-transparent hover:border-cyan-500/30"
                                    >
                                        <div className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 mb-1">Fill User</div>
                                        <div className="text-[10px] text-slate-500 font-mono">user@hiro.com</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fillCreds('admin')}
                                        className="text-left p-3 rounded-lg hover:bg-white/5 transition-colors group border border-transparent hover:border-amber-500/30"
                                    >
                                        <div className="text-xs font-bold text-amber-400 group-hover:text-amber-300 mb-1">Fill Admin</div>
                                        <div className="text-[10px] text-slate-500 font-mono">admin@hiro.com</div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 px-4 py-3 bg-red-500/10 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 flex gap-3 items-start animate-fade-in">
                                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-6 px-4 py-3 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/20 flex gap-3 items-start animate-fade-in">
                                <Shield size={14} className="mt-0.5 flex-shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-4">
                            {isRegister && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-cyan-500/80 uppercase tracking-widest pl-2">Callsign</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                        placeholder="Enter Username"
                                        required={isRegister}
                                    />
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-cyan-500/80 uppercase tracking-widest pl-2">Comms ID</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-cyan-500/80 uppercase tracking-widest pl-2">Passcode</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            {isRegister && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-cyan-500/80 uppercase tracking-widest pl-2">Confirm Passcode</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                        placeholder="••••••••"
                                        required={isRegister}
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/40 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                            >
                                <span>{loading ? 'Processing...' : (isRegister ? 'Initialize Protocol' : 'Engage System')}</span>
                                {!loading && <ChevronRight size={16} />}
                            </button>
                        </form>

                        <div className="pt-6 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(!isRegister);
                                    setError(null);
                                }}
                                className="text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                            >
                                {isRegister ? 'Return to Login' : 'Request New Clearance'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center w-full max-w-md">
                        <p className="text-[10px] font-mono text-cyan-900/60 uppercase tracking-[0.2em] flex items-center justify-center gap-4">
                            <span>Hiro Marine OS v2.1</span>
                            <a href="/about" className="hover:text-cyan-400 transition-colors border-b border-transparent hover:border-cyan-400/50">System Manual</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GoalItem({ icon, title, desc }: any) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
            <div className="mt-1 p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-white text-lg">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
