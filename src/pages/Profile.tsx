import React, { useEffect, useState } from 'react';
import { useGamification } from '../contexts/GamificationContext';
import { Hexagon, Award, Droplets, Mountain, Edit2, History, ChevronRight, Settings, FileText, Loader2, X, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Profile() {
    const { xp, level, rank, shells, badges, stats } = useGamification();
    const [missionHistory, setMissionHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', bio: '' });
    const [updating, setUpdating] = useState(false);

    // Derived state
    const [isAdmin, setIsAdmin] = useState(false);
    const nextLevelXp = level * 1000;
    const progressPercent = ((xp % 1000) / 1000) * 100;

    useEffect(() => {
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
        await supabase.auth.signOut();
        window.location.href = '/login';
    };
    useEffect(() => {
        const loadUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('players').select('name, bio').eq('id', user.id).single();
                if (data) setEditForm({ name: data.name || '', bio: data.bio || '' });
            }
        };
        if (showEditModal) loadUserData();
    }, [showEditModal]);

    // Fetch Mission History (Mock/Real)
    useEffect(() => {
        const fetchHistory = async () => {
            // In a real app, query table 'mission_submissions'
            // For now, we mock it or query if possible. 
            // Let's try to query if we have the table, otherwise empty.
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase
                    .from('mission_submissions')
                    .select('*, missions(*)')
                    .eq('player_id', user.id)
                    .order('submitted_at', { ascending: false });

                if (data) setMissionHistory(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const { error } = await supabase.from('players').update({
                name: editForm.name,
                bio: editForm.bio
            }).eq('id', user.id);

            if (error) throw error;
            setShowEditModal(false);
            window.location.reload(); // Simple reload to refresh context
        } catch (e) {
            alert('Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="h-full w-full p-4 lg:p-10 overflow-y-auto custom-scrollbar bg-linear-to-br from-slate-900 via-[#0B1120] to-surface-pure text-slate-200">
            <div className="max-w-6xl mx-auto space-y-8 pb-20">
                {/* ... (Header content mostly same, just updating buttons) ... */}

                {/* Header Section: ID Card style */}
                <div className="relative overflow-hidden flex flex-col lg:flex-row gap-10 items-center lg:items-start group border border-white/5 bg-slate-900/60 backdrop-blur-xl shadow-2xl rounded-3xl p-8 md:p-10">
                    {/* Watermark */}
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000 transform group-hover:rotate-12 pointer-events-none">
                        <Hexagon size={300} strokeWidth={0.5} className="text-cyan-500" />
                    </div>

                    {/* Avatar / Rank Insignia */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0">
                        <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-[ripple_3s_infinite]"></div>
                        <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-[ripple_3s_infinite_1s]"></div>

                        <div className="w-full h-full rounded-full border-4 border-slate-900 flex items-center justify-center bg-linear-to-br from-cyan-600 to-blue-900 relative z-10 overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-500">
                            <span className="text-5xl font-display font-black italic text-white relative z-10 drop-shadow-md">{level}</span>
                        </div>
                        <div className="absolute -bottom-3 w-full text-center z-20">
                            <span className="bg-amber-400 text-slate-900 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg border border-white/20">Lvl {level}</span>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center lg:text-left z-10 w-full">
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-2">
                            <div>
                                <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
                                    <span className="text-cyan-400/80 text-xs uppercase tracking-[0.3em] font-bold">Operative Active</span>
                                </div>
                                <h1 className="text-5xl font-display font-black text-white mb-2 italic tracking-wide drop-shadow-lg">{editForm.name || 'Commander'}</h1>
                                <p className="text-cyan-300 text-sm mb-6 font-serif italic inline-block font-medium">{rank} Class Authorization</p>
                            </div>

                            <div className="flex gap-3 mx-auto lg:mx-0">
                                {isAdmin && (
                                    <button
                                        onClick={() => window.location.href = '/admin'}
                                        className="px-4 py-3 rounded-xl bg-alert-red/10 hover:bg-alert-red text-alert-red hover:text-white border border-alert-red/20 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2 group cursor-pointer"
                                        title="Command Center"
                                    >
                                        <Shield size={18} className="group-hover:scale-110 transition-transform" />
                                        <span>Command</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="p-3 rounded-full bg-white/5 hover:bg-cyan-500/10 text-cyan-400 border border-white/10 transition-colors group cursor-pointer hover:border-cyan-500/30"
                                    title="Edit Profile"
                                >
                                    <Edit2 size={18} className="group-hover:text-cyan-300" />
                                </button>
                                <button
                                    onClick={() => setShowSettingsModal(true)}
                                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 transition-colors group cursor-pointer"
                                    title="Settings"
                                >
                                    <Settings size={18} className="group-hover:text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-950/50 h-4 rounded-full overflow-hidden mb-3 p-[2px] shadow-inner border border-white/5">
                            <div
                                className="h-full bg-linear-to-r from-blue-600 via-cyan-500 to-cyan-300 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                style={{ width: `${progressPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">
                            <span>{xp} XP / {nextLevelXp} XP</span>
                            <span className="text-cyan-400">{Math.round(progressPercent)}% to Tier Unification</span>
                        </div>
                    </div>
                    {/* Currency */}
                    <div className="px-8 py-6 flex flex-col items-center justify-center min-w-[160px] bg-slate-900/80 border border-white/10 shadow-lg rounded-2xl backdrop-blur-sm">
                        <span className="text-amber-400 text-[10px] uppercase tracking-[0.3em] mb-2 font-bold">Shells</span>
                        <span className="text-4xl font-display font-black text-white tracking-widest">{shells}</span>
                    </div>
                </div>

                {/* Mobile Logout Button */}
                <div className="lg:hidden">
                    <button
                        onClick={handleLogout}
                        className="w-full p-4 flex items-center justify-center gap-3 bg-slate-900/50 rounded-2xl border border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer group"
                    >
                        <div className="p-2 rounded-full bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                            <X size={16} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-rose-400 group-hover:text-rose-300 transition-colors">Disengage System</span>
                    </button>
                </div>

                {/* Existing Stats Grid & History code (kept same structure) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard label="Missions" value={stats.missionsCompleted} icon={<Award className="text-cyan-400" size={24} />} />
                            <StatCard label="Debris Kg" value={stats.plasticRemovedKg} icon={<Droplets className="text-blue-400" size={24} />} />
                            <StatCard label="Sector Km" value={stats.coastlineProtectedKm} icon={<Mountain className="text-amber-400" size={24} />} />
                        </div>

                        {/* Mission Log */}
                        <div className="p-6 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-lg">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                                    <History className="text-cyan-500" size={20} />
                                    Mission Log
                                </h3>
                                <button className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors">
                                    View All <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {loadingHistory ? (
                                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-cyan-400" /></div>
                                ) : (
                                    missionHistory.map((item) => (
                                        <div key={item.id} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/60 hover:border-cyan-500/30 transition-all cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold text-sm mb-1 group-hover:text-cyan-300 transition-colors">{item.missions?.title || 'Unknown Mission'}</h4>
                                                    <div className="flex gap-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                                        <span className="text-cyan-400/70">{item.missions?.type}</span>
                                                        <span>•</span>
                                                        <span>{new Date(item.submitted_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${item.status === 'Approved' ? 'text-emerald-400' : item.status === 'Pending' ? 'text-amber-400' : 'text-rose-400'}`}>
                                                    {item.status}
                                                </div>
                                                <div className="text-xs text-white font-bold">+{item.missions?.xp_reward} XP</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="p-6 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 h-full">
                            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3 italic">
                                <Award className="text-amber-400" size={28} />
                                Commendations
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {badges.map(badge => (
                                    <div key={badge.id} className={`p-4 rounded-2xl flex flex-col items-center text-center transition-all duration-500 group relative overflow-hidden border ${badge.unlocked ? 'bg-slate-800/60 border-cyan-500/20 hover:border-cyan-500/50' : 'bg-slate-950/50 border-white/5 opacity-50 grayscale'}`}>
                                        <div className="w-16 h-16 mb-3 relative">
                                            <div className={`w-full h-full rounded-full flex items-center justify-center ${badge.unlocked ? 'bg-cyan-900/30 text-3xl shadow-lg border border-cyan-400/20' : 'bg-slate-900 text-2xl border border-white/5'}`}>
                                                {badge.unlocked ? '🏆' : '🔒'}
                                            </div>
                                        </div>
                                        <h3 className={`font-display text-sm mb-1 italic font-bold ${badge.unlocked ? 'text-white' : 'text-slate-500'}`}>{badge.name}</h3>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full mb-2 uppercase tracking-widest font-bold ${badge.rarity === 'Legendary' ? 'text-amber-400 bg-amber-500/10' : badge.rarity === 'Mythic' ? 'text-purple-400 bg-purple-500/10' : 'text-cyan-400 bg-cyan-500/10'}`}>{badge.rarity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Functional Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowEditModal(false)}>
                    <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
                        <h3 className="text-xl font-bold text-white mb-6">Operative Data</h3>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Callsign</label>
                                <input
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                                    placeholder="Enter Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Bio / Status</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none h-24 resize-none"
                                    placeholder="Mission status..."
                                />
                            </div>
                            <button disabled={updating} type="submit" className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all flex justify-center">
                                {updating ? <Loader2 className="animate-spin" /> : 'Update Records'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowSettingsModal(false)}>
                    <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
                        <h3 className="text-xl font-bold text-white mb-6">System Configuration</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5">
                                <span className="text-sm font-medium text-slate-300">Ambient Audio</span>
                                <div className="w-10 h-5 bg-cyan-900/50 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-3 h-3 bg-cyan-500 rounded-full"></div></div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5">
                                <span className="text-sm font-medium text-slate-300">haptics</span>
                                <div className="w-10 h-5 bg-slate-800 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-3 h-3 bg-slate-500 rounded-full"></div></div>
                            </div>
                            <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 text-center">
                                <span className="text-xs text-slate-500 block mb-2">Hiro Marine OS v2.1.0</span>
                                <button onClick={handleLogout} className="text-rose-500 text-xs font-bold uppercase tracking-widest hover:underline">Force Disconnect</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
    return (
        <div className="p-5 flex items-center gap-4 bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/60 transition-all duration-300 group">
            <div className="p-3 bg-slate-900/80 rounded-full border border-white/10 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div>
                <div className="text-3xl font-display font-black text-white tracking-tight leading-none mb-1 shadow-black drop-shadow-md">{value}</div>
                <div className="text-[9px] text-slate-500 group-hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] font-bold">{label}</div>
            </div>
        </div>
    );
}
