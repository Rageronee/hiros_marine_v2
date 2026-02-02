import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart, MessageSquare, Share2, Users, Send, ImageIcon, Trophy, AlertTriangle, Loader2, TrendingUp, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Profile {
    username: string;
    avatar_url: string;
    rank_label: string;
}

interface Comment {
    id: string;
    content: string;
    user_id: string;
    profiles: Profile;
    created_at: string;
}

interface Post {
    id: string;
    content: string;
    image_url?: string;
    user_id: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    category: string;
    profiles: Profile;
    liked_by_user?: boolean; // Virtual field for UI state
}

interface Clan {
    id: string;
    name: string;
    score: number;
    color: string;
    members: number;
}

const CATEGORIES = ['General', 'Mission Report', 'Discovery', 'Question', 'Alert'];
const SORT_OPTIONS = ['Newest', 'Popular', 'Trending'];

export default function Community() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [clans, setClans] = useState<Clan[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostCategory, setNewPostCategory] = useState('General');

    // Filters & Search
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('Newest');

    useEffect(() => {
        fetchPosts();
        fetchClans();

        const channel = supabase
            .channel('public:community_posts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, async (payload) => {
                const { data } = await supabase
                    .from('community_posts')
                    .select('*, profiles:user_id(username, avatar_url, rank_label)')
                    .eq('id', payload.new.id)
                    .single();

                if (data) setPosts(current => [data as Post, ...current]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('community_posts')
                .select(`
                    *,
                    profiles:players (
                        username:name,
                        avatar_url,
                        rank_label:role
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClans = async () => {
        try {
            const { data, error } = await supabase
                .from('clans')
                .select('*')
                .order('score', { ascending: false });

            if (error) throw error;
            setClans(data || []);
        } catch (error) {
            console.error("Error fetching clans:", error);
        }
    };

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;
        setSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Authentication required.');
                return;
            }

            const { error } = await supabase
                .from('community_posts')
                .insert({
                    content: newPostContent,
                    user_id: user.id,
                    category: newPostCategory
                });

            if (error) throw error;
            setNewPostContent('');
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Tab State
    const [activeTab, setActiveTab] = useState<'feed' | 'squads' | 'leaderboard'>('feed');

    return (
        <div className="h-full w-full p-4 lg:p-6 lg:pb-0 flex flex-col gap-6 bg-linear-to-br from-slate-900 via-[#0B1120] to-surface-pure text-slate-200 overflow-hidden max-w-[1920px] mx-auto">

            {/* Top Navigation Tabs */}
            <header className="flex items-center justify-between shrink-0">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${activeTab === 'feed' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/5'}`}
                    >
                        <MessageSquare size={16} /> Global Feed
                    </button>
                    <button
                        onClick={() => setActiveTab('squads')}
                        className={`px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${activeTab === 'squads' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/5'}`}
                    >
                        <Shield size={16} /> Squads
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${activeTab === 'leaderboard' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/5'}`}
                    >
                        <Trophy size={16} /> Leaderboard
                    </button>
                </div>

                {/* Search Bar - Global for now */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64 bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-cyan-500/50 text-white placeholder:text-slate-500 transition-all"
                    />
                </div>
            </header>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'feed' && <FeedView posts={posts} loading={loading} fetchPosts={fetchPosts} handlePostSubmit={handlePostSubmit} newPostContent={newPostContent} setNewPostContent={setNewPostContent} newPostCategory={newPostCategory} setNewPostCategory={setNewPostCategory} submitting={submitting} filterCategory={filterCategory} setFilterCategory={setFilterCategory} sortBy={sortBy} setSortBy={setSortBy} searchQuery={searchQuery} clans={clans} />}
                {activeTab === 'squads' && <SquadsView />}
                {activeTab === 'leaderboard' && (
                    <div className="flex items-center justify-center h-full text-center">
                        <div className="max-w-md p-8 bg-slate-800/50 rounded-3xl border border-white/5">
                            <Trophy size={48} className="mx-auto text-amber-400 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Global Leaderboard</h2>
                            <p className="text-slate-400">Detailed rankings are being calibrated. Check back soon.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-components
function FeedView({ posts, loading, handlePostSubmit, newPostContent, setNewPostContent, newPostCategory, setNewPostCategory, submitting, filterCategory, setFilterCategory, sortBy, setSortBy, searchQuery, clans }: any) {
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [showRankingModal, setShowRankingModal] = useState(false);

    // Filter Logic
    const filteredPosts = posts
        .filter((p: Post) => filterCategory === 'All' || p.category === filterCategory)
        .filter((p: Post) => p.content.toLowerCase().includes(searchQuery.toLowerCase()) || p.profiles?.username.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a: Post, b: Post) => {
            if (sortBy === 'Newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'Popular') return b.likes_count - a.likes_count;
            return 0;
        });

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex gap-4 mb-4 shrink-0">
                <button
                    onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                    className={`p-3 rounded-2xl border border-white/10 shadow-sm transition-colors cursor-pointer ${isMobileFiltersOpen ? 'bg-cyan-500 text-slate-900 border-cyan-400' : 'bg-slate-800/50 text-slate-300'}`}
                >
                    <Filter size={20} />
                </button>
            </div>

            {/* Mobile Filters Drawer */}
            {isMobileFiltersOpen && (
                <div className="lg:hidden mb-6 space-y-4 animate-slide-down shrink-0">
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        <button
                            onClick={() => setFilterCategory('All')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border shadow-sm transition-all ${filterCategory === 'All' ? 'bg-cyan-500 border-cyan-400 text-slate-900' : 'bg-slate-800 border-white/10 text-slate-400'}`}
                        >
                            All Channels
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border shadow-sm transition-all ${filterCategory === cat ? 'bg-cyan-500 border-cyan-400 text-slate-900' : 'bg-slate-800 border-white/10 text-slate-400'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Left Sidebar (Desktop Filters & Info) */}
            <div className="hidden lg:flex w-50 flex-col gap-6 h-full overflow-hidden shrink-0 pb-6">
                <div className="p-5 bg-slate-800/40 backdrop-blur-md rounded-4xl border border-white/5 shadow-xl flex flex-col gap-6 h-full">

                    {/* Categories */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                            <Filter size={10} /> Channels
                        </h3>
                        <div className="flex flex-col gap-1.5">
                            <button
                                onClick={() => setFilterCategory('All')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex justify-between items-center ${filterCategory === 'All' ? 'bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                Global Feed
                                {filterCategory === 'All' && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                            </button>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex justify-between items-center ${filterCategory === cat ? 'bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    {cat}
                                    {filterCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rules - Compact */}
                    <div className="pt-4 border-t border-white/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2 px-1">
                            <AlertTriangle size={10} className="text-amber-400" /> Protocol
                        </h3>
                        <ul className="text-[10px] text-slate-400 space-y-1.5 font-medium leading-relaxed bg-slate-900/30 p-3 rounded-xl border border-white/5">
                            <li className="flex gap-2 items-start"><span className="text-cyan-500 mt-0.5">•</span> Respectful comms only.</li>
                            <li className="flex gap-2 items-start"><span className="text-cyan-500 mt-0.5">•</span> No classified leaks.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Main Feed */}
            <div className="flex-1 overflow-hidden flex flex-col h-full rounded-4xl relative min-w-0">
                {/* Header (Desktop) - Compact */}
                <header className="hidden lg:flex items-end justify-between mb-4 px-2">
                    <div>
                        <h1 className="text-3xl font-display font-black text-white italic drop-shadow-md">Global Feed</h1>
                        <p className="text-cyan-400/60 text-xs font-bold tracking-wide uppercase">Live transmissions</p>
                    </div>
                    <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5 shadow-inner">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                onClick={() => setSortBy(opt)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all ${sortBy === opt ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-24 px-1">
                    {/* Create Post Widget */}
                    <div className="p-6 bg-slate-800/40 backdrop-blur-md rounded-4xl border border-white/10 shadow-lg">
                        <form onSubmit={handlePostSubmit} className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
                                YOU
                            </div>
                            <div className="flex-1 space-y-4">
                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder="Broadcast high-priority message..."
                                    className="w-full bg-slate-900/60 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none h-20 transition-all border border-white/5 hover:border-white/10"
                                />
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex gap-2">
                                        <button type="button" className="text-cyan-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer bg-slate-900/50" title="Attach Image">
                                            <ImageIcon size={18} />
                                        </button>
                                        <select
                                            value={newPostCategory}
                                            onChange={(e) => setNewPostCategory(e.target.value)}
                                            className="bg-slate-900/50 text-[10px] uppercase font-bold text-cyan-400 rounded-xl px-3 py-2 outline-none border border-white/10 hover:border-cyan-500/30 cursor-pointer appearance-none pl-3 pr-8 relative shadow-sm"
                                            style={{ backgroundImage: 'none' }}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newPostContent.trim() || submitting}
                                        className="bg-cyan-500 text-slate-900 font-bold py-2.5 px-6 rounded-xl text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-0.5"
                                    >
                                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                        Transmit
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Posts Feed */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-cyan-400/50">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="text-[10px] uppercase tracking-widest font-bold">Decrypting signals...</p>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-white/5 bg-white/5 rounded-4xl">
                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 opacity-50">
                                <Search className="text-slate-400" size={24} />
                            </div>
                            <h4 className="text-white font-bold text-lg mb-2">Signal Silence</h4>
                            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">No transmissions found. Be the first to broadcast.</p>
                        </div>
                    ) : (
                        filteredPosts.map((post: Post) => <PostCard key={post.id} post={post} />)
                    )}
                </div>
            </div>

            {/* Right Sidebar (Leaderboard - Desktop) */}
            <div className="hidden lg:flex w-60 flex-col h-full overflow-hidden shrink-0 pb-6">
                <div className="p-6 bg-slate-800/40 backdrop-blur-md border border-white/5 shadow-xl h-full flex flex-col rounded-4xl">
                    <h3 className="font-display font-bold text-white flex items-center gap-2 mb-6 text-base">
                        <Trophy size={18} className="text-amber-400" /> Sector Leaders
                    </h3>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {clans.map((clan: Clan, index: number) => (
                            <div key={clan.id} className="group cursor-pointer hover:bg-white/5 p-3 rounded-2xl transition-all border border-transparent hover:border-white/5">
                                <div className="flex items-center justify-between mb-2 text-xs font-bold">
                                    <div className="flex items-center gap-3 text-white">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] ${index < 3 ? 'bg-amber-500 text-slate-900 shadow-amber-500/50 shadow-sm' : 'bg-slate-700 text-slate-300'}`}>
                                            {index + 1}
                                        </span>
                                        <span className="group-hover:text-cyan-300 transition-colors">{clan.name}</span>
                                    </div>
                                    <span className="text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded text-[10px] border border-cyan-500/20">{clan.score.toLocaleString()}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-2">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out flex relative overflow-hidden ${clan.color.replace('text-', 'bg-')}`}
                                        style={{ width: `${(clan.score / (clans[0]?.score || 1)) * 100}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1 font-bold tracking-wide">
                                        <Users size={10} /> {clan.members}
                                    </span>
                                    <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-bold">
                                        <TrendingUp size={10} /> +{(index + 1) * 4}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowRankingModal(true)}
                        className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-white/5 cursor-pointer"
                    >
                        View Full Rankings
                    </button>
                </div>
            </div>

            {/* Feature Locked Modal (Internal to FeedView now) */}
            {showRankingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowRankingModal(false)}>
                    <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                        <button onClick={() => setShowRankingModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"><AlertTriangle size={20} /></button>

                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 mx-auto border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white mb-2">Access Restricted</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Global Leaderboard protocols are currently under development by High Command.
                                <br /><span className="text-amber-500/80 text-xs font-mono mt-2 block">ERROR_CODE: FEATURE_LOCKED_Lv5</span>
                            </p>
                            <button
                                onClick={() => setShowRankingModal(false)}
                                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest border border-white/5 transition-colors cursor-pointer"
                            >
                                Acknowledge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ... actually, let's just REPLACE the return statement and put the existing huge block inside {activeTab === 'feed' && (...)}.
// And simply add the HEADER above it.
// This is safer.

function SquadsView() {
    const [squads, setSquads] = useState<any[]>([]);
    const [mySquad, setMySquad] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [createModalInfo, setCreateModalInfo] = useState({ show: false, name: '', description: '' });

    useEffect(() => {
        fetchSquadData();
    }, []);

    const fetchSquadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Check if user is in a squad
                const { data: membership } = await supabase.from('squad_members').select('*, squads(*)').eq('user_id', user.id).single();
                if (membership) {
                    setMySquad(membership);
                }
            }

            // Fetch all squads
            const { data: allSquads } = await supabase.from('squads').select('*').order('member_count', { ascending: false });
            setSquads(allSquads || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSquad = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Create Squad
            const { data: newSquad, error } = await supabase.from('squads').insert({
                name: createModalInfo.name,
                description: createModalInfo.description,
                leader_id: user.id,
                member_count: 1
            }).select().single();

            if (error) throw error;

            // 2. Add Leader as Member
            const { error: memberError } = await supabase.from('squad_members').insert({
                squad_id: newSquad.id,
                user_id: user.id,
                role: 'Leader'
            });

            if (memberError) throw memberError;

            setCreateModalInfo({ show: false, name: '', description: '' });
            fetchSquadData(); // Refresh

        } catch (e: any) {
            alert('Failed to create squad: ' + e.message);
        }
    };

    const handleJoinSquad = async (squadId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('squad_members').insert({
                squad_id: squadId,
                user_id: user.id,
                role: 'Member'
            });

            if (error) throw error;

            // Optimistic update or refresh
            // Also update member count (tricky without trigger, but okay for proto)
            // await supabase.rpc('increment_squad_count', { row_id: squadId }); // Mock 

            fetchSquadData();
        } catch (e: any) {
            alert('Failed to join squad: ' + e.message);
        }
    };

    const handleLeaveSquad = async () => {
        if (!confirm("Are you sure you want to leave your squad?")) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('squad_members').delete().eq('user_id', user.id);
            setMySquad(null);
            fetchSquadData();
        } catch (e: any) {
            alert('Error leaving squad');
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-cyan-400" /></div>;

    if (mySquad) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="max-w-2xl w-full bg-slate-900/50 border border-cyan-500/30 p-12 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-cyan-500 shadow-[0_0_20px_#22d3ee]"></div>

                    <Shield size={64} className="text-cyan-400 mx-auto mb-6" />
                    <h2 className="text-4xl font-display font-black text-white mb-2">{mySquad.squads.name}</h2>
                    <p className="text-slate-400 mb-8">{mySquad.squads.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-slate-800 rounded-xl">
                            <div className="text-xs text-slate-500 uppercase font-bold">Role</div>
                            <div className="text-xl font-bold text-white">{mySquad.role}</div>
                        </div>
                        <div className="p-4 bg-slate-800 rounded-xl">
                            <div className="text-xs text-slate-500 uppercase font-bold">Joined</div>
                            <div className="text-xl font-bold text-white">{new Date(mySquad.joined_at).toLocaleDateString()}</div>
                        </div>
                    </div>

                    <button onClick={handleLeaveSquad} className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors">
                        Leave Squad
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-display font-black text-white">Active Squads</h2>
                    <p className="text-slate-400 text-sm">Join a fireteam to dominate the leaderboards.</p>
                </div>
                <button
                    onClick={() => setCreateModalInfo({ ...createModalInfo, show: true })}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl uppercase tracking-widest text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                >
                    <Shield size={16} /> Create Squad
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {squads.map(sq => (
                    <div key={sq.id} className="p-6 bg-slate-800/40 border border-white/5 hover:border-cyan-500/30 rounded-3xl transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors">
                                <Users size={24} />
                            </div>
                            <span className="bg-slate-900 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-white/5">{sq.member_count} Members</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{sq.name}</h3>
                        <p className="text-sm text-slate-400 mb-6 line-clamp-2">{sq.description}</p>
                        <button
                            onClick={() => handleJoinSquad(sq.id)}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-colors"
                        >
                            Request Join
                        </button>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {createModalInfo.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setCreateModalInfo({ ...createModalInfo, show: false })}>
                    <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-6">Form New Squad</h3>
                        <form onSubmit={handleCreateSquad} className="space-y-4">
                            <input
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                                placeholder="Squad Name"
                                value={createModalInfo.name}
                                onChange={e => setCreateModalInfo({ ...createModalInfo, name: e.target.value })}
                                required
                            />
                            <textarea
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none h-24 resize-none"
                                placeholder="Description"
                                value={createModalInfo.description}
                                onChange={e => setCreateModalInfo({ ...createModalInfo, description: e.target.value })}
                            />
                            <button type="submit" className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl uppercase tracking-widest text-xs transition-colors">
                                Confirm & Initialize
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Interactive Post Card
function PostCard({ post }: { post: Post }) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes_count);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState('');

    const handleLike = () => {
        if (liked) {
            setLikeCount(c => c - 1);
        } else {
            setLikeCount(c => c + 1);
        }
        setLiked(!liked);
        // In real app, call Supabase here debounced
    };

    const toggleComments = async () => {
        setShowComments(!showComments);
        if (!showComments && comments.length === 0) {
            setLoadingComments(true);
            // Simulate fetch
            setTimeout(() => {
                setComments([
                    { id: '1', content: 'Great update! Keep the seas clean.', user_id: '2', created_at: new Date().toISOString(), profiles: { username: 'DeepDiver', rank_label: 'Scout', avatar_url: '' } },
                    { id: '2', content: 'Copy that. I am in the sector as well.', user_id: '3', created_at: new Date().toISOString(), profiles: { username: 'MarineBio', rank_label: 'Officer', avatar_url: '' } }
                ]);
                setLoadingComments(false);
            }, 1000);
        }
    };

    return (
        <div className="p-6 bg-slate-800/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-sm hover:border-cyan-500/30 transition-all group animate-fade-in relative overflow-hidden">

            {/* Category Tag (Absolute Top Right for visual flair) */}
            <div className="absolute top-0 right-0 p-4">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${post.category === 'Alert' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    }`}>
                    {post.category}
                </span>
            </div>

            <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-700 overflow-hidden shrink-0 border border-white/10 shadow-lg">
                    {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} alt={post.profiles.username} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs bg-linear-to-br from-slate-700 to-slate-800">
                            {post.profiles?.username?.[0] || 'U'}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col mb-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            {post.profiles?.username || 'Unknown Operative'}
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-cyan-400 border border-white/5 font-mono uppercase tracking-wide">
                                {post.profiles?.rank_label || 'Ranger'}
                            </span>
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold">{new Date(post.created_at).toLocaleString()}</p>
                    </div>

                    <p className="text-slate-200 text-sm leading-relaxed mb-4 font-medium">{post.content}</p>

                    {post.image_url && (
                        <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg relative group/image">
                            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors pointer-events-none" />
                            <img src={post.image_url} alt="Post attachment" className="w-full max-h-80 object-cover" />
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${liked ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Heart size={16} className={liked ? 'fill-rose-400' : ''} />
                            {likeCount}
                        </button>

                        <button
                            onClick={toggleComments}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${showComments ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <MessageSquare size={16} />
                            {post.comments_count}
                        </button>

                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer ml-auto">
                            <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
                        </button>
                    </div>

                    {/* Comments Section */}
                    {showComments && (
                        <div className="mt-4 pt-4 border-t border-white/5 animate-slide-down">
                            {loadingComments ? (
                                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-cyan-400" size={16} /></div>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map(comment => (
                                        <div key={comment.id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-white/5">
                                                {comment.profiles?.username[0]}
                                            </div>
                                            <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-cyan-400">{comment.profiles?.username}</span>
                                                    <span className="text-[9px] text-slate-500">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-xs text-slate-300 leading-relaxed">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 items-center mt-2">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="flex-1 bg-slate-900 rounded-lg px-3 py-2 text-xs text-white border border-white/10 focus:border-cyan-500/50 outline-none"
                                        />
                                        <button className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors">
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
