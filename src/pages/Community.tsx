import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart, MessageSquare, Share2, Users, Send, ImageIcon, Trophy, AlertTriangle, Loader2, TrendingUp } from 'lucide-react';
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
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
                    profiles:user_id (
                        username,
                        avatar_url,
                        rank_label
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

    // Filter Logic
    const filteredPosts = posts
        .filter(p => filterCategory === 'All' || p.category === filterCategory)
        .filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()) || p.profiles?.username.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'Newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'Popular') return b.likes_count - a.likes_count;
            return 0;
        });

    return (
        <div className="h-full w-full p-4 lg:p-6 lg:pb-0 flex flex-col lg:flex-row gap-6 bg-gradient-to-br from-slate-900 via-[#0B1120] to-[#0f172a] text-slate-200 overflow-hidden max-w-[1920px] mx-auto">

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search frequency..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 text-white placeholder:text-slate-500 shadow-sm"
                    />
                </div>
                <button
                    onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                    className={`p-3 rounded-2xl border border-white/10 shadow-sm transition-colors ${isMobileFiltersOpen ? 'bg-cyan-500 text-slate-900 border-cyan-400' : 'bg-slate-800/50 text-slate-300'}`}
                >
                    <Filter size={20} />
                </button>
            </div>

            {/* Mobile Filters Drawer */}
            {isMobileFiltersOpen && (
                <div className="lg:hidden mb-6 space-y-4 animate-slide-down">
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
                    <div className="flex gap-2">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                onClick={() => setSortBy(opt)}
                                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border shadow-sm transition-all ${sortBy === opt ? 'bg-slate-700 border-cyan-500/30 text-cyan-400' : 'bg-slate-900 border-white/10 text-slate-500'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Left Sidebar (Desktop Filters & Info) - Reduced Width for Main Feed Priority */}
            <div className="hidden lg:flex w-50 flex-col gap-6 h-full overflow-hidden flex-shrink-0 pb-6">
                <div className="p-5 bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-white/5 shadow-xl flex flex-col gap-6 h-full">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Scan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs font-medium focus:outline-none focus:border-cyan-500/50 text-white placeholder:text-slate-500 transition-all focus:bg-slate-900"
                        />
                    </div>

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

            {/* Main Feed - PRIORITIZED (Wider, Flex-1) */}
            <div className="flex-1 overflow-hidden flex flex-col h-full rounded-[2rem] relative min-w-0">
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
                    <div className="p-6 bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-lg">
                        <form onSubmit={handlePostSubmit} className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
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
                        <div className="p-12 text-center border-2 border-dashed border-white/5 bg-white/5 rounded-[2rem]">
                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 opacity-50">
                                <Search className="text-slate-400" size={24} />
                            </div>
                            <h4 className="text-white font-bold text-lg mb-2">Signal Silence</h4>
                            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">No transmissions found. Be the first to broadcast.</p>
                            <button
                                onClick={() => { setSearchQuery(''); setFilterCategory('All'); }}
                                className="px-5 py-2.5 rounded-xl bg-slate-800 text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-white hover:bg-slate-700 transition-all"
                            >
                                Reset Scanners
                            </button>
                        </div>
                    ) : (
                        filteredPosts.map(post => <PostCard key={post.id} post={post} />)
                    )}
                </div>
            </div>

            {/* Right Sidebar (Leaderboard - Desktop) - Fixed Width, less dominant */}
            <div className="hidden lg:flex w-60 flex-col h-full overflow-hidden flex-shrink-0 pb-6">
                <div className="p-6 bg-slate-800/40 backdrop-blur-md border border-white/5 shadow-xl h-full flex flex-col rounded-[2rem]">
                    <h3 className="font-display font-bold text-white flex items-center gap-2 mb-6 text-base">
                        <Trophy size={18} className="text-amber-400" /> Sector Leaders
                    </h3>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {clans.map((clan, index) => (
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

                    <button className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-white/5">
                        View Full Rankings
                    </button>
                </div>
            </div>
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
                <div className="w-12 h-12 rounded-2xl bg-slate-700 overflow-hidden flex-shrink-0 border border-white/10 shadow-lg">
                    {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} alt={post.profiles.username} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs bg-gradient-to-br from-slate-700 to-slate-800">
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
