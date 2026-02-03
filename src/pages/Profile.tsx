import React, { useEffect, useState } from 'react';
import { useGamification } from '../contexts/GamificationContext';
import html2canvas from 'html2canvas';
import { Hexagon, Award, Droplets, Mountain, Edit2, History, ChevronRight, Settings, FileText, Loader2, X, Shield, Bell, Lock, Globe, HelpCircle, AlertOctagon, LogOut, Share2, Volume2, VolumeX, Play, Pause, SkipForward } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useSoundscape } from '../contexts/SoundscapeContext';

export default function Profile() {
    const navigate = useNavigate();
    const { xp, level, rank, shells, badges, stats, equippedFrame, equippedTitle } = useGamification();
    const { currentZone, setZone, isMuted, toggleMute } = useSoundscape();
    const [missionHistory, setMissionHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', bio: '' });
    const [updating, setUpdating] = useState(false);
    const [settings, setSettings] = useState({ audio: true, haptics: true, notifications: true, language: 'en' });
    const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'account'>('general');
    const [changePasswordMode, setChangePasswordMode] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    // Equipped Items State
    const [frameItem, setFrameItem] = useState<any>(null);
    const [titleItem, setTitleItem] = useState<any>(null);

    useEffect(() => {
        const fetchEquippedItems = async () => {
            if (equippedFrame) {
                const { data } = await supabase.from('shop_items').select('*').eq('id', equippedFrame).single();
                setFrameItem(data);
            } else {
                setFrameItem(null);
            }
            if (equippedTitle) {
                const { data } = await supabase.from('shop_items').select('*').eq('id', equippedTitle).single();
                setTitleItem(data);
            } else {
                setTitleItem(null);
            }
        };
        fetchEquippedItems();
    }, [equippedFrame, equippedTitle]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        setUpdatingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
            if (error) throw error;
            alert("Password updated successfully");
            setChangePasswordMode(false);
            setPasswordForm({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            alert("Error updating password: " + error.message);
        } finally {
            setUpdatingPassword(false);
        }
    };

    const toggleLanguage = () => {
        const newLang = settings.language === 'en' ? 'id' : 'en';
        const newSettings = { ...settings, language: newLang };
        setSettings(newSettings);
        localStorage.setItem('hiro_settings', JSON.stringify(newSettings));
    };

    const handlePrintID = async () => {
        setIsPrinting(true);
        const element = document.getElementById('id-card-container');
        if (element) {
            try {
                const canvas = await html2canvas(element, {
                    backgroundColor: '#0f172a', // Ensure dark background
                    scale: 2, // High resolution
                    logging: false,
                    useCORS: true
                });
                const link = document.createElement('a');
                link.download = `agent-id-${displayCallsign}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (err) {
                console.error("Print failed:", err);
                alert("Failed to generate ID Card");
            }
        }
        setIsPrinting(false);
    };

    // Derived state
    const [isAdmin, setIsAdmin] = useState(false);
    const nextLevelXp = level * 1000;
    const progressPercent = ((xp % 1000) / 1000) * 100;

    // Load Settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('hiro_settings');
        if (saved) setSettings({ ...settings, ...JSON.parse(saved) });
    }, []);

    // Save Settings to localStorage
    const toggleSetting = (key: keyof typeof settings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        localStorage.setItem('hiro_settings', JSON.stringify(newSettings));
    };

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
        navigate('/login');
    };
    useEffect(() => {
        const loadUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('players').select('name, bio').eq('id', user.id).single();
                if (data) setEditForm({ name: data.name || '', bio: data.bio || '' });
            }
        };
        loadUserData();
    }, []); // Run on mount to ensure name is available immediately

    // Display Name Logic (Email fallback)
    const displayName = editForm.name || 'Unknown Operative';
    const displayCallsign = displayName.includes('@') ? displayName.split('@')[0] : displayName;

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
            <div className="max-w-6xl mx-auto space-y-8 pb-32">

                {/* Header Section: ID Card style */}
                <div id="id-card-container" className="relative flex flex-col lg:flex-row gap-6 lg:gap-10 items-center lg:items-start group border border-white/5 bg-slate-900/60 backdrop-blur-xl shadow-xl rounded-3xl p-6 md:p-10 transition-all">
                    {/* Watermark - Now clipped only to this absolute container if needed, or remove verify overflow */}
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000 transform group-hover:rotate-12 pointer-events-none overflow-hidden rounded-3xl inset-0 z-0">
                        <Hexagon size={200} strokeWidth={0.5} className="text-cyan-500 md:w-[300px] md:h-[300px] absolute -right-10 -top-10" />
                    </div>

                    {/* Avatar / Rank Insignia */}
                    <div className="relative w-24 h-24 md:w-40 md:h-40 shrink-0 z-10">

                        {/* Avatar Frame Mockup (Logic to select frame based on frameItem) */}
                        {frameItem ? (
                            <div className="absolute -inset-4 md:-inset-6 z-20 pointer-events-none">
                                {/* Since we don't have real assets yet, we use CSS borders/effects based on rarity or generic frame */}
                                {frameItem.rarity === 'Legendary' && (
                                    <div className="w-full h-full border-[6px] border-amber-500 rounded-full shadow-[0_0_20px_#f59e0b] animate-pulse-slow relative">
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-[8px] px-1 rounded-sm text-black font-black">LEGEND</div>
                                    </div>
                                )}
                                {frameItem.rarity !== 'Legendary' && (
                                    <div className="w-full h-full border-[6px] border-cyan-400 rounded-full shadow-[0_0_20px_#22d3ee]"></div>
                                )}
                            </div>
                        ) : (
                            // Default pulses if no frame
                            <>
                                <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-[ripple_3s_infinite]"></div>
                                <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-[ripple_3s_infinite_1s]"></div>
                            </>
                        )}


                        <div className="w-full h-full rounded-full border-4 border-slate-900 flex items-center justify-center bg-linear-to-br from-cyan-600 to-blue-900 relative z-10 overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-500">
                            <span className="text-3xl md:text-5xl font-display font-black italic text-white relative z-10 drop-shadow-md">{level}</span>
                        </div>
                        <div className="absolute -bottom-2 md:-bottom-3 w-full text-center z-20">
                            <span className="bg-amber-400 text-slate-900 text-[9px] md:text-[10px] font-bold px-3 py-1 md:px-4 md:py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg border border-white/20">Lvl {level}</span>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center lg:text-left z-10 w-full">
                        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-4 mb-2">
                            <div className="w-full min-w-0">
                                <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
                                    <span className="text-cyan-400/80 text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">Operative Active</span>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-display font-black text-white mb-2 italic tracking-wide drop-shadow-lg truncate capitalize flex items-center gap-3 justify-center lg:justify-start">
                                    {displayCallsign}
                                    {titleItem && (
                                        <span className={`px-2 py-1 rounded-md text-[10px] md:text-xs align-middle uppercase tracking-wider relative -top-1 ${titleItem.rarity === 'Legendary' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' :
                                            titleItem.rarity === 'Rare' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' :
                                                'bg-slate-700 text-slate-300'
                                            }`}>
                                            {titleItem.name}
                                        </span>
                                    )}
                                </h1>
                                <p className="text-cyan-300 text-xs md:text-sm mb-6 font-serif italic inline-block font-medium">{rank} Class Authorization</p>
                            </div>

                            <div className="flex gap-3 shrink-0">
                                {isAdmin && (
                                    <button
                                        onClick={() => navigate('/admin')}
                                        className="px-4 py-3 rounded-xl bg-alert-red/10 hover:bg-alert-red text-alert-red hover:text-white border border-alert-red/20 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2 group cursor-pointer"
                                        title="Command Center"
                                    >
                                        <Shield size={18} className="group-hover:scale-110 transition-transform" />
                                        <span className="hidden md:inline">Command</span>
                                    </button>
                                )}
                                <button
                                    onClick={handlePrintID}
                                    disabled={isPrinting}
                                    className="p-3 rounded-full bg-white/5 hover:bg-cyan-500/10 text-cyan-400 border border-white/10 transition-colors group cursor-pointer hover:border-cyan-500/30"
                                    title="Print ID Card"
                                >
                                    {isPrinting ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} className="group-hover:text-cyan-300" />}
                                </button>
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
                        <div className="w-full bg-slate-950/50 h-3 md:h-4 rounded-full overflow-hidden mb-3 p-[2px] shadow-inner border border-white/5">
                            <div
                                className="h-full bg-linear-to-r from-blue-600 via-cyan-500 to-cyan-300 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                style={{ width: `${progressPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-[9px] md:text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">
                            <span>{xp} XP / {nextLevelXp} XP</span>
                            <span className="text-cyan-400">{Math.round(progressPercent)}% to Tier Unification</span>
                        </div>
                    </div>
                    {/* Currency */}
                    <div className="w-full lg:w-auto px-6 py-4 md:px-8 md:py-6 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 min-w-0 md:min-w-[160px] bg-slate-900/80 border border-white/10 shadow-lg rounded-2xl backdrop-blur-sm">
                        <span className="text-amber-400 text-[10px] uppercase tracking-[0.3em] font-bold">Shells</span>
                        <span className="text-3xl md:text-4xl font-display font-black text-white tracking-widest">{shells}</span>
                    </div>
                </div>

                {/* Mobile Logout Button */}
                <div className="lg:hidden">
                    <button
                        onClick={handleLogout}
                        className="w-full p-4 flex items-center justify-center gap-3 bg-slate-900/50 rounded-2xl border border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer group"
                    >
                        <div className="p-2 rounded-full bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                            <LogOut size={16} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-rose-400 group-hover:text-rose-300 transition-colors">Disengage System</span>
                    </button>
                </div>

                {/* Existing Stats Grid & History code (kept same structure) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
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
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-slate-900 border border-white/10 p-6 md:p-8 rounded-3xl max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
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
                            <button disabled={updating} type="submit" className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all flex justify-center cursor-pointer">
                                {updating ? <Loader2 className="animate-spin" /> : 'Update Records'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Enhanced Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowSettingsModal(false)}>
                    <div className="bg-slate-900 border border-white/10 p-0 rounded-3xl max-w-md w-full relative overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings size={20} className="text-cyan-500" /> System Params
                            </h3>
                            <button onClick={() => setShowSettingsModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/5">
                            <button
                                onClick={() => setActiveSettingsTab('general')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSettingsTab === 'general' ? 'text-cyan-400 bg-cyan-500/10 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                General
                            </button>
                            <button
                                onClick={() => setActiveSettingsTab('account')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSettingsTab === 'account' ? 'text-cyan-400 bg-cyan-500/10 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Account
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            {activeSettingsTab === 'general' ? (
                                <>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Soundscape System</h4>
                                        <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isMuted ? 'bg-slate-800 text-slate-500' : 'bg-cyan-500/10 text-cyan-400'} transition-colors`}>
                                                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-white block">Active Zone</span>
                                                        <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">{currentZone}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={toggleMute}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isMuted ? 'border-white/10 text-slate-400 hover:text-white' : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'}`}
                                                >
                                                    {isMuted ? <Play size={16} className="ml-0.5" /> : <Pause size={16} />}
                                                </button>
                                            </div>

                                            {/* Visualizer Mock */}
                                            {!isMuted && (
                                                <div className="flex items-center justify-center gap-1 h-8 opacity-50">
                                                    {[...Array(12)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-1 bg-cyan-500 rounded-full animate-wave"
                                                            style={{
                                                                height: `${Math.random() * 100}%`,
                                                                animationDuration: `${0.5 + Math.random()}s`
                                                            }}
                                                        ></div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                                                {['Menu', 'Pantura', 'SouthCoast', 'Silence'].map((zone) => (
                                                    <button
                                                        key={zone}
                                                        onClick={() => setZone(zone as any)}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider whitespace-nowrap transition-all border ${currentZone === zone ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'}`}
                                                    >
                                                        {zone}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Interface</h4>
                                        <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => toggleSetting('audio')}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-800 text-slate-400"><Settings size={16} /></div>
                                                <span className="text-sm font-medium text-slate-300">Ambient Audio</span>
                                            </div>
                                            <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.audio ? 'bg-cyan-900/50' : 'bg-slate-800'}`}>
                                                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${settings.audio ? 'right-1 bg-cyan-500' : 'left-1 bg-slate-500'}`}></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => toggleSetting('haptics')}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-800 text-slate-400"><History size={16} /></div>
                                                <span className="text-sm font-medium text-slate-300">Haptic Feedback</span>
                                            </div>
                                            <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.haptics ? 'bg-cyan-900/50' : 'bg-slate-800'}`}>
                                                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${settings.haptics ? 'right-1 bg-cyan-500' : 'left-1 bg-slate-500'}`}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notifications</h4>
                                        <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => toggleSetting('notifications')}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-800 text-slate-400"><Bell size={16} /></div>
                                                <span className="text-sm font-medium text-slate-300">Push Alerts</span>
                                            </div>
                                            <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.notifications ? 'bg-cyan-900/50' : 'bg-slate-800'}`}>
                                                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${settings.notifications ? 'right-1 bg-cyan-500' : 'left-1 bg-slate-500'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Security</h4>

                                        {/* Change Password Dropdown */}
                                        <div className="rounded-xl border border-white/5 bg-slate-950/50 overflow-hidden">
                                            <button
                                                onClick={() => setChangePasswordMode(!changePasswordMode)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-cyan-400"><Lock size={16} /></div>
                                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">Change Password</span>
                                                </div>
                                                <ChevronRight size={16} className={`text-slate-600 group-hover:text-white transition-transform ${changePasswordMode ? 'rotate-90' : ''}`} />
                                            </button>

                                            {changePasswordMode && (
                                                <form onSubmit={handlePasswordChange} className="p-4 pt-0 space-y-3 animate-fade-in text-right">
                                                    <input
                                                        type="password"
                                                        placeholder="New Password"
                                                        required
                                                        minLength={6}
                                                        value={passwordForm.newPassword}
                                                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-cyan-500 outline-none"
                                                    />
                                                    <input
                                                        type="password"
                                                        placeholder="Confirm Password"
                                                        required
                                                        minLength={6}
                                                        value={passwordForm.confirmPassword}
                                                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-cyan-500 outline-none"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={updatingPassword}
                                                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {updatingPassword ? 'Updating...' : 'Update Password'}
                                                    </button>
                                                </form>
                                            )}
                                        </div>

                                        {/* Language Toggle */}
                                        <button
                                            onClick={toggleLanguage}
                                            className="w-full flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-cyan-400"><Globe size={16} /></div>
                                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">Language</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500 font-mono uppercase">{settings.language === 'en' ? 'English (US)' : 'Bahasa Indonesia'}</span>
                                                <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
                                            </div>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Support</h4>
                                        <a href="mailto:support@hiromarine.com?subject=Help Center Inquiry" className="w-full flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-left group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-emerald-400"><HelpCircle size={16} /></div>
                                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">Help Center</span>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
                                        </a>
                                        <a href="mailto:bugs@hiromarine.com?subject=Issue Report - Hiro OS" className="w-full flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-left group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-amber-400"><AlertOctagon size={16} /></div>
                                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">Report Issue</span>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
                                        </a>
                                    </div>
                                </>
                            )}

                            <div className="pt-4 border-t border-white/5">
                                <button onClick={handleLogout} className="w-full py-3 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2">
                                    <LogOut size={16} /> Disconnect System
                                </button>
                                <span className="block text-center text-[10px] text-slate-600 mt-3 font-mono">Hiro Marine OS v2.1.0</span>
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
