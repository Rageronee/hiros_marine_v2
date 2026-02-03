import { useState, useEffect, memo } from 'react';
import { Search, Filter, Heart, MessageSquare, Share2, Users, Send, ImageIcon, Trophy, AlertTriangle, Loader2, TrendingUp, Shield, Trash2, CheckCircle, MoreHorizontal } from 'lucide-react';
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
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Filters & Search
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('Newest');

    useEffect(() => {
        checkUser();
        fetchPosts();
        fetchClans();

        // Subscribe to NEW posts and UPDATES
        const channel = supabase
            .channel('public:community_posts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, async (payload) => {
                // Deduplication check: Don't add if already in state (e.g. from our own immediate submission)
                setPosts(current => {
                    if (current.find(p => p.id === payload.new.id)) return current;

                    // If not found, fetch details and add
                    fetchSinglePostAndAdd(payload.new.id);
                    return current;
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_posts' }, (payload) => {
                setPosts(current => current.map(p =>
                    p.id === payload.new.id
                        ? { ...p, likes_count: payload.new.likes_count, comments_count: payload.new.comments_count }
                        : p
                ));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_posts' }, (payload) => {
                setPosts(current => current.filter(p => p.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUser(user);
            // Check Admin Status
            const { data } = await supabase.from('players').select('role').eq('id', user.id).single();
            if (data?.role === 'Admin' || data?.role === 'Moderator') {
                setIsAdmin(true);
            }
        }
    };

    const fetchSinglePostAndAdd = async (id: string) => {
        const { data } = await supabase
            .from('community_posts')
            .select('*, profiles:players(username:name, avatar_url, rank_label:role)')
            .eq('id', id)
            .single();

        if (data) {
            setPosts(current => {
                if (current.find(p => p.id === data.id)) return current;
                return [data as Post, ...current];
            });
        }
    }

    const fetchPosts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Fetch Posts
            const { data: postsData, error } = await supabase
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

            // 2. Fetch User Likes
            let likedPostIds = new Set();
            if (user) {
                const { data: likesData } = await supabase
                    .from('community_likes')
                    .select('post_id')
                    .eq('user_id', user.id);

                if (likesData) {
                    likesData.forEach(l => likedPostIds.add(l.post_id));
                }
            }

            // 3. Merge
            const merged = (postsData || []).map(p => ({
                ...p,
                liked_by_user: likedPostIds.has(p.id)
            }));

            setPosts(merged);
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

            // Insert and SELECT immediately
            const { data, error } = await supabase
                .from('community_posts')
                .insert({
                    content: newPostContent,
                    user_id: user.id,
                    category: newPostCategory
                })
                .select(`
                    *,
                    profiles:players (
                        username:name,
                        avatar_url,
                        rank_label:role
                    )
                `)
                .single();

            if (error) throw error;

            // Instant Update
            if (data) {
                setPosts(current => [data as Post, ...current]);
            }

            setNewPostContent('');
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this transmission?")) return;
        try {
            const { error } = await supabase.from('community_posts').delete().eq('id', postId);
            if (error) throw error;

            // Optimistic Remove
            setPosts(current => current.filter(p => p.id !== postId));
        } catch (e: any) {
            alert('Failed to delete: ' + e.message);
        }
    };

    // Tab State
    const [activeTab, setActiveTab] = useState<'feed' | 'squads' | 'leaderboard'>('feed');

    return (
        <div className="h-full w-full p-0 sm:p-4 lg:p-6 lg:pb-0 flex flex-col gap-6 bg-linear-to-br from-slate-900 via-[#0B1120] to-surface-pure text-slate-200 overflow-hidden max-w-[1920px] mx-auto">

            {/* Top Navigation Tabs - Desktop */}
            <header className="hidden sm:flex items-center justify-between shrink-0">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'feed' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/5'}`}
                    >
                        <MessageSquare size={16} /> Global Feed
                    </button>
                    <button
                        onClick={() => setActiveTab('squads')}
                        className={`px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'squads' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/5'}`}
                    >
                        <Shield size={16} /> Squads
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'leaderboard' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/5'}`}
                    >
                        <Trophy size={16} /> Leaderboard
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64 bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-cyan-500/50 text-white placeholder:text-slate-500 transition-all cursor-text"
                    />
                </div>
            </header>

            {/* Mobile Header Tabs */}
            <header className="flex sm:hidden overflow-x-auto gap-2 p-2 bg-slate-900/50 backdrop-blur-md border-b border-white/5 no-scrollbar shrink-0">
                <button onClick={() => setActiveTab('feed')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeTab === 'feed' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}>Feed</button>
                <button onClick={() => setActiveTab('squads')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeTab === 'squads' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}>Squads</button>
                <button onClick={() => setActiveTab('leaderboard')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeTab === 'leaderboard' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}>Ranking</button>
            </header>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'feed' && <FeedView posts={posts} loading={loading} fetchPosts={fetchPosts} handlePostSubmit={handlePostSubmit} newPostContent={newPostContent} setNewPostContent={setNewPostContent} newPostCategory={newPostCategory} setNewPostCategory={setNewPostCategory} submitting={submitting} filterCategory={filterCategory} setFilterCategory={setFilterCategory} sortBy={sortBy} setSortBy={setSortBy} searchQuery={searchQuery} clans={clans} isAdmin={isAdmin} onDeletePost={handleDeletePost} currentUser={currentUser} />}
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

// Extracted Sidebar
const FeedSidebar = memo(({ filterCategory, setFilterCategory }: { filterCategory: string, setFilterCategory: (c: string) => void }) => (
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
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex justify-between items-center cursor-pointer ${filterCategory === 'All' ? 'bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        Global Feed
                        {filterCategory === 'All' && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex justify-between items-center cursor-pointer ${filterCategory === cat ? 'bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            {cat}
                            {filterCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rules */}
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
));

const LeaderboardSidebar = memo(({ clans }: { clans: Clan[] }) => {
    const [showRankingModal, setShowRankingModal] = useState(false);
    return (
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
            {/* Feature Locked Modal */}
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
});


// Sub-components
function FeedView({ posts, loading, handlePostSubmit, newPostContent, setNewPostContent, newPostCategory, setNewPostCategory, submitting, filterCategory, setFilterCategory, sortBy, setSortBy, searchQuery, clans, isAdmin, onDeletePost, currentUser }: any) {
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
            {/* Left Sidebar (Desktop Filters & Info) - MEMOIZED */}
            <FeedSidebar filterCategory={filterCategory} setFilterCategory={setFilterCategory} />

            {/* Main Feed */}
            <div className="flex-1 overflow-hidden flex flex-col h-full rounded-none sm:rounded-4xl relative min-w-0">
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
                                className={`px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${sortBy === opt ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 sm:space-y-6 pb-24 sm:pb-32 px-0 sm:px-1">
                    {/* Create Post Widget */}
                    <div className="p-4 sm:p-6 bg-slate-900 border-b border-white/5 sm:bg-slate-800/40 sm:backdrop-blur-md sm:rounded-4xl sm:border border-white/10 sm:shadow-lg">
                        <form onSubmit={handlePostSubmit} className="flex gap-3 sm:gap-4">
                            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 items-center justify-center shrink-0 text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
                                YOU
                            </div>
                            <div className="flex-1 space-y-3 sm:space-y-4">
                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder="What's happening?"
                                    className="w-full bg-slate-900/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-cyan-500/30 resize-none h-16 sm:h-20 transition-all border border-white/5 hover:border-white/10"
                                />
                                <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
                                    <div className="flex gap-2">
                                        <button type="button" className="text-cyan-400 hover:text-white transition-colors p-1.5 sm:p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer bg-slate-900/50" title="Attach Image">
                                            <ImageIcon size={18} />
                                        </button>
                                        <select
                                            value={newPostCategory}
                                            onChange={(e) => setNewPostCategory(e.target.value)}
                                            className="bg-slate-900/50 text-[10px] uppercase font-bold text-cyan-400 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 outline-none border border-white/10 hover:border-cyan-500/30 cursor-pointer appearance-none pl-3 pr-8 relative shadow-sm"
                                            style={{ backgroundImage: 'none' }}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newPostContent.trim() || submitting}
                                        className="bg-cyan-500 text-slate-900 font-bold py-2 px-4 sm:py-2.5 sm:px-6 rounded-lg sm:rounded-xl text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-0.5"
                                    >
                                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                        Post
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
                        <div className="p-12 text-center border-2 border-dashed border-white/5 bg-white/5 rounded-4xl mx-4 sm:mx-0">
                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 opacity-50">
                                <Search className="text-slate-400" size={24} />
                            </div>
                            <h4 className="text-white font-bold text-lg mb-2">Signal Silence</h4>
                            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">No transmissions found. Be the first to broadcast.</p>
                        </div>
                    ) : (
                        filteredPosts.map((post: Post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                canDelete={isAdmin || post.user_id === currentUser?.id}
                                onDelete={() => onDeletePost(post.id)}
                                currentUser={currentUser}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Right Sidebar - MEMOIZED */}
            <LeaderboardSidebar clans={clans} />
        </div>
    );
}

function SquadsView() {
    // ... [Content unchanged - simplifying for byte limit, but normally I would include it]
    // Re-inserting existing SquadsView functionality for completeness
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
                const { data: membership } = await supabase.from('squad_members').select('*, squads(*)').eq('user_id', user.id).maybeSingle();
                if (membership) setMySquad(membership);
            }
            const { data: allSquads } = await supabase.from('squads').select('*').order('member_count', { ascending: false });
            setSquads(allSquads || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCreateSquad = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: newSquad, error } = await supabase.from('squads').insert({ name: createModalInfo.name, description: createModalInfo.description, leader_id: user.id, member_count: 1 }).select().single();
            if (error) throw error;
            await supabase.from('squad_members').insert({ squad_id: newSquad.id, user_id: user.id, role: 'Leader' });
            setCreateModalInfo({ show: false, name: '', description: '' });
            fetchSquadData();
        } catch (e: any) { alert('Failed to create squad: ' + e.message); }
    };

    const handleJoinSquad = async (squadId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabase.from('squad_members').insert({ squad_id: squadId, user_id: user.id, role: 'Member' });
            if (error) throw error;
            fetchSquadData();
        } catch (e: any) { alert('Failed to join squad: ' + e.message); }
    };

    const handleLeaveSquad = async () => {
        if (!confirm("Are you sure you want to leave your squad?")) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from('squad_members').delete().eq('user_id', user.id);
            setMySquad(null);
            fetchSquadData();
        } catch (e: any) { alert('Error leaving squad'); }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-cyan-400" /></div>;

    if (mySquad) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in relative z-10">
                <div className="max-w-2xl w-full bg-slate-900/50 border border-cyan-500/30 p-12 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-cyan-500 shadow-[0_0_20px_#22d3ee]"></div>
                    <Shield size={64} className="text-cyan-400 mx-auto mb-6" />
                    <h2 className="text-4xl font-display font-black text-white mb-2">{mySquad.squads.name}</h2>
                    <p className="text-slate-400 mb-8">{mySquad.squads.description}</p>
                    <button onClick={handleLeaveSquad} className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer">Leave Squad</button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-display font-black text-white">Active Squads</h2>
                <button onClick={() => setCreateModalInfo({ ...createModalInfo, show: true })} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl uppercase tracking-widest text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"><Shield size={16} /> Create Squad</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {squads.map(sq => (
                    <div key={sq.id} className="p-6 bg-slate-800/40 border border-white/5 hover:border-cyan-500/30 rounded-3xl transition-all group">
                        <h3 className="text-xl font-bold text-white mb-2">{sq.name}</h3>
                        <p className="text-sm text-slate-400 mb-6 line-clamp-2">{sq.description}</p>
                        <button onClick={() => handleJoinSquad(sq.id)} className="w-full py-3 bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-colors cursor-pointer">Request Join</button>
                    </div>
                ))}
            </div>
            {createModalInfo.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setCreateModalInfo({ ...createModalInfo, show: false })}>
                    <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-6">Form New Squad</h3>
                        <form onSubmit={handleCreateSquad} className="space-y-4">
                            <input className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none" placeholder="Squad Name" value={createModalInfo.name} onChange={e => setCreateModalInfo({ ...createModalInfo, name: e.target.value })} required />
                            <textarea className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none h-24 resize-none" placeholder="Description" value={createModalInfo.description} onChange={e => setCreateModalInfo({ ...createModalInfo, description: e.target.value })} />
                            <button type="submit" className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl uppercase tracking-widest text-xs transition-colors cursor-pointer">Confirm & Initialize</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Interactive Post Card - REFACTORED FOR FACEBOOK-STYLE MOBILE LAYOUT
function PostCard({ post, canDelete, onDelete, currentUser }: { post: Post, canDelete: boolean, onDelete: () => void, currentUser: any }) {
    const [liked, setLiked] = useState(post.liked_by_user);
    const [likeCount, setLikeCount] = useState(post.likes_count);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [copied, setCopied] = useState(false);

    // Sync local state if parent post updates (e.g. from Realtime)
    useEffect(() => {
        setLikeCount(post.likes_count);
    }, [post.likes_count]);

    const handleShare = () => {
        const text = `${post.profiles?.username} posted: "${post.content}" - Hiro Marine`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLike = async () => {
        const previousLiked = liked;
        const previousCount = likeCount;

        // Optimistic
        setLiked(!previousLiked);
        setLikeCount(c => previousLiked ? c - 1 : c + 1);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (previousLiked) {
                // Unlike
                await supabase.from('community_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
            } else {
                // Like
                await supabase.from('community_likes').insert({ post_id: post.id, user_id: user.id });
            }
        } catch (e) {
            console.error("Error toggling like:", e);
            // Revert
            setLiked(previousLiked);
            setLikeCount(previousCount);
        }
    };

    const toggleComments = async () => {
        setShowComments(!showComments);
        if (!showComments && comments.length === 0) {
            fetchComments();
        }
    };

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const { data, error } = await supabase
                .from('community_comments')
                .select('*, profiles:players(username:name)')
                .eq('post_id', post.id)
                .order('created_at', { ascending: true });

            if (!error) setComments(data as any[] || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Delete this comment?")) return;
        try {
            const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
            if (error) throw error;
            setComments(current => current.filter(c => c.id !== commentId));
        } catch (e: any) {
            console.error("Error deleting comment:", e);
        }
    };

    const submitComment = async () => {
        if (!commentText.trim()) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Insert comment
            const { data, error } = await supabase
                .from('community_comments')
                .insert({
                    post_id: post.id,
                    user_id: user.id,
                    content: commentText
                })
                .select('*, profiles:players(username:name)')
                .single();

            if (error) throw error;

            if (data) setComments([...comments, data as any]);
            setCommentText('');

        } catch (e) {
            console.error("Error submitting comment:", e);
        }
    };

    const displayName = post.profiles?.username || 'Classified Agent';
    const displayAvatar = post.profiles?.avatar_url;

    return (
        <div className="bg-slate-900 border-b border-white/5 sm:border sm:bg-slate-800/40 sm:backdrop-blur-md sm:rounded-3xl sm:border-white/5 sm:shadow-sm hover:border-cyan-500/30 transition-all group animate-fade-in relative overflow-hidden mb-2 sm:mb-4 pb-2">

            {/* Header: Facebook Style */}
            <div className="flex justify-between items-start p-4 pb-2">
                <div className="flex gap-3 min-w-0 items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-white/10 shadow-lg">
                        {displayAvatar ? (
                            <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs bg-linear-to-br from-slate-700 to-slate-800">
                                {displayName.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col min-w-0">
                        <h4 className="text-sm font-bold text-white leading-tight">
                            {displayName}
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-medium">{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-[10px] text-slate-600">•</span>
                            <span className={`text-[9px] font-bold uppercase ${post.category === 'Alert' ? 'text-rose-400' : 'text-cyan-500'}`}>{post.category}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center">
                    {canDelete && (
                        <button
                            onClick={onDelete}
                            className="text-slate-500 hover:text-rose-400 p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="px-4 pb-2">
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Full Width Media */}
            {post.image_url && (
                <div className="mb-2 w-full bg-black/20">
                    <img src={post.image_url} alt="Post attachment" className="w-full h-auto max-h-[500px] object-contain sm:object-cover" />
                </div>
            )}

            {/* Stats / Counts Row */}
            <div className="px-4 py-2 flex justify-between items-center text-xs text-slate-500 border-b border-white/5 mx-4 sm:mx-0">
                <div className="flex items-center gap-1">
                    {likeCount > 0 && (
                        <>
                            <div className="p-1 rounded-full bg-rose-500/20 text-rose-500">
                                <Heart size={10} fill="currentColor" />
                            </div>
                            <span>{likeCount}</span>
                        </>
                    )}
                </div>
                <div className="flex gap-4">
                    {post.comments_count > 0 && <span>{post.comments_count} comments</span>}
                </div>
            </div>

            {/* Action Bar */}
            <div className="px-2 py-1 flex items-center justify-between sm:justify-start sm:gap-8 border-t border-transparent sm:border-white/5 mx-2">
                <button
                    onClick={handleLike}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${liked ? 'text-rose-400' : 'text-slate-400 hover:bg-white/5'}`}
                >
                    <Heart size={18} className={liked ? 'fill-rose-400' : ''} />
                    Like
                </button>

                <button
                    onClick={toggleComments}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 transition-all cursor-pointer"
                >
                    <MessageSquare size={18} />
                    Comment
                </button>

                <button
                    onClick={handleShare}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 transition-all cursor-pointer"
                >
                    {copied ? <CheckCircle size={18} className="text-emerald-400" /> : <Share2 size={18} />}
                    Share
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="px-4 pb-4 animate-slide-down">
                    <div className="pt-2 border-t border-white/5 mb-4"></div>
                    {loadingComments ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin text-cyan-400" size={16} /></div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-2 group/comment">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-white/5 shrink-0">
                                        {comment.profiles?.username?.[0] || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="bg-slate-800/50 rounded-2xl rounded-tl-none p-3 border border-white/5 relative">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <span className="text-xs font-bold text-white truncate">{comment.profiles?.username || 'Classified Agent'}</span>
                                            </div>
                                            <p className="text-xs text-slate-300 leading-relaxed break-words">{comment.content}</p>
                                        </div>
                                        <div className="flex gap-4 mt-1 ml-2">
                                            <span className="text-[10px] text-slate-500 font-bold">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {(currentUser?.id === comment.user_id || canDelete) && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-[10px] text-slate-500 hover:text-rose-400 font-bold transition-colors cursor-pointer"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-2 items-center mt-4">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-white/5 shrink-0">
                                    YOU
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                                        placeholder="Write a comment..."
                                        className="w-full bg-slate-900 rounded-2xl px-4 py-2 text-xs text-white border border-white/10 focus:border-cyan-500/50 outline-none pr-10"
                                    />
                                    <button onClick={submitComment} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-cyan-400 hover:text-white transition-colors cursor-pointer">
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
