import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Plus, Trash2, Edit, Save, X, Database, Shield, Newspaper, Fish, CheckCircle, ExternalLink } from 'lucide-react';

export default function AdminDashboard() {
    // RBAC & Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Data Management State
    const [activeTab, setActiveTab] = useState<'Missions' | 'News' | 'Specimens' | 'Verifications'>('Missions');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // 1. Check Admin Role on Mount
    useEffect(() => {
        const checkAdminRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setCheckingAuth(false);
                return;
            }

            // Check role in players table
            // Check role in players table
            const { data: player } = await supabase
                .from('players')
                .select('role')
                .eq('id', user.id)
                .single();

            if (player && player.role === 'Admin') {
                setIsAuthenticated(true);
            }
            setCheckingAuth(false);
        };

        checkAdminRole();
    }, []);

    // 2. Fetch Data when Authenticated & Tab Changes
    const fetchData = async () => {
        setLoading(true);
        try {
            let table = '';
            let selectQuery = '*';

            if (activeTab === 'Missions') table = 'missions';
            if (activeTab === 'News') table = 'news';
            if (activeTab === 'Specimens') table = 'specimens';
            if (activeTab === 'Verifications') {
                table = 'mission_submissions';
                selectQuery = '*, missions(title, xp_reward, shell_reward), players(name, clan)';
            }

            let query = supabase.from(table).select(selectQuery);

            if (activeTab === 'Verifications') {
                query = query.order('submitted_at', { ascending: false });
            } else {
                // Sort by ID or Created At by default
                query = query.order('id', { ascending: true });
            }

            const { data: result, error } = await query;

            if (error) throw error;
            setData(result || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, activeTab]);

    // 3. Handlers
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return;

        let table = activeTab.toLowerCase();
        if (activeTab === 'Specimens') table = 'specimens';

        const { error } = await supabase.from(table).delete().eq('id', id);
        if (!error) {
            setData(data.filter(item => item.id !== id));
        } else {
            alert('Delete failed: ' + error.message);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const item = editingItem;
        let table = activeTab.toLowerCase();
        if (activeTab === 'Specimens') table = 'specimens';

        try {
            // If creating, insert
            if (isCreating) {
                // For specimens/news/missions, ensure strict typing isn't blocking us.
                // We're casting to any for flexibility in this rapid prototype.
                const { data: newItem, error } = await supabase.from(table).insert([item]).select();
                if (error) throw error;
                setData([newItem[0], ...data]);
            } else {
                // If updating
                const { error } = await supabase.from(table).update(item).eq('id', item.id);
                if (error) throw error;
                setData(data.map(d => d.id === item.id ? { ...d, ...item } : d));
            }
            setEditingItem(null);
            setIsCreating(false);
        } catch (err: any) {
            alert('Operation failed: ' + err.message);
        }
    };

    // 4. Loading & Access Control Views
    if (checkingAuth) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-ocean-light" size={48} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="marine-card p-12 max-w-md w-full text-center border-alert-red/30">
                    <Shield size={64} className="mx-auto text-alert-red mb-6" />
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400 mb-8">
                        Your operative profile does not have administrative clearance.
                        Contact fleet command if this is an error.
                    </p>
                    <div className="bg-alert-red/10 border border-alert-red/20 rounded-xl p-4 text-xs font-mono text-alert-red">
                        ERROR_CODE: INSUFFICIENT_PRIVILEGES
                    </div>
                </div>
            </div>
        );
    }

    // 5. Main Dashboard View
    return (
        <div className="h-full w-full p-8 flex flex-col overflow-hidden">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-ocean-depth">Command Center</h1>
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Database Management Console</p>
                </div>
                <div className="flex gap-4">
                    <TabButton active={activeTab === 'Missions'} onClick={() => setActiveTab('Missions')} icon={<Shield size={16} />} label="Missions" />
                    <TabButton active={activeTab === 'News'} onClick={() => setActiveTab('News')} icon={<Newspaper size={16} />} label="News" />
                    <TabButton active={activeTab === 'Specimens'} onClick={() => setActiveTab('Specimens')} icon={<Fish size={16} />} label="Specimens" />
                    <TabButton active={activeTab === 'Verifications'} onClick={() => setActiveTab('Verifications')} icon={<CheckCircle size={16} />} label="Verifications" />
                </div>
            </header>

            <div className="flex-1 marine-card p-0 overflow-hidden flex flex-col relative">
                {/* Toolbar */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-transparent backdrop-blur-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{data.length} Records Found</span>
                    <button
                        onClick={() => { setEditingItem({}); setIsCreating(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20"
                    >
                        <Plus size={16} /> Add New
                    </button>
                </div>

                {/* Table / List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="animate-spin text-cyan-400" size={40} />
                        </div>
                    ) : data.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                            <Database size={48} className="mb-4 text-slate-600" />
                            <p className="text-sm font-bold uppercase tracking-widest">Database Connected</p>
                            <p className="text-xs">No records found in '{activeTab}'</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 text-xs font-bold text-slate-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="p-6">ID</th>
                                    <th className="p-6">Title / Name</th>
                                    <th className="p-6">Category / Type</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            {activeTab === 'Verifications' ? (
                                <tbody className="divide-y divide-white/5">
                                    {data.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-6 font-mono text-xs text-slate-500">{item.id.substring(0, 8)}...</td>
                                            <td className="p-6">
                                                <div className="font-bold text-white">{item.missions?.title}</div>
                                                <div className="text-xs text-slate-400">By: {item.players?.name}</div>
                                            </td>
                                            <td className="p-6 text-sm text-slate-400">
                                                <a href={item.proof_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                                                    View Proof <ExternalLink size={12} />
                                                </a>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : item.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                    {item.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                {item.status === 'Pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Approve mission and grant rewards?')) return;
                                                                try {
                                                                    await supabase.from('mission_submissions').update({ status: 'Approved', reviewed_at: new Date() }).eq('id', item.id);
                                                                    fetchData();
                                                                } catch (e) { alert('Error approving'); }
                                                            }}
                                                            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg" title="Approve"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Reject submission?')) return;
                                                                await supabase.from('mission_submissions').update({ status: 'Rejected', reviewed_at: new Date() }).eq('id', item.id);
                                                                fetchData();
                                                            }}
                                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg" title="Reject"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            ) : (
                                <tbody className="divide-y divide-white/5">
                                    {data.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-6 font-mono text-xs text-slate-500">{item.id.substring(0, 8)}...</td>
                                            <td className="p-6 font-bold text-white">{item.title || item.name}</td>
                                            <td className="p-6 text-sm text-slate-400">{item.category || item.type || item.latin_name}</td>
                                            <td className="p-6">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                                    {item.status || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingItem(item); setIsCreating(false); }} className="p-2 text-cyan-400 hover:bg-white/5 rounded-lg">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            )}
                        </table>
                    )}
                </div>

                {/* Edit Modal */}
                {editingItem && (
                    <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-xl p-8 flex flex-col animate-in fade-in slide-in-from-bottom-10">
                        <header className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-display font-bold text-white">
                                {isCreating ? 'Create New Entry' : 'Edit Entry'}
                            </h2>
                            <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </header>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {activeTab === 'Missions' && <MissionFormFields item={editingItem} onChange={(update: any) => setEditingItem({ ...editingItem, ...update })} />}
                                {activeTab === 'News' && <NewsFormFields item={editingItem} onChange={(update: any) => setEditingItem({ ...editingItem, ...update })} />}
                                {activeTab === 'Specimens' && <SpecimenFormFields item={editingItem} onChange={(update: any) => setEditingItem({ ...editingItem, ...update })} />}
                            </div>

                            <div className="mt-8 flex justify-end gap-4 pt-8 border-t border-white/10">
                                <button type="button" onClick={() => setEditingItem(null)} className="px-6 py-3 rounded-full text-slate-400 font-bold text-sm hover:bg-white/5 transition-colors">Cancel</button>
                                <button type="submit" className="btn-primary flex items-center gap-2">
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all text-xs font-bold uppercase tracking-widest ${active ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-transparent text-slate-400 hover:text-white border border-white/5 hover:border-white/20'}`}
        >
            {icon} {label}
        </button>
    );
}

// Field Helpers
function InputGroup({ label, value, onChange, type = "text", placeholder = "" }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
            {type === 'textarea' ? (
                <textarea
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-surface-foam border border-slate-200 rounded-xl p-4 text-ocean-depth focus:ring-2 focus:ring-ocean-light focus:outline-none h-32 resize-none"
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-surface-foam border border-slate-200 rounded-xl p-4 text-ocean-depth focus:ring-2 focus:ring-ocean-light focus:outline-none"
                    placeholder={placeholder}
                />
            )}
        </div>
    );
}

function MissionFormFields({ item, onChange }: any) {
    return (
        <>
            <InputGroup label="Mission Title" value={item.title} onChange={(v: string) => onChange({ title: v })} />
            <InputGroup label="Location" value={item.location} onChange={(v: string) => onChange({ location: v })} />

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                <select
                    value={item.type || 'Cleanup'}
                    onChange={(e) => onChange({ type: e.target.value })}
                    className="w-full bg-surface-foam border border-slate-200 rounded-xl p-4 text-ocean-depth appearance-none"
                >
                    <option value="Cleanup">Cleanup</option>
                    <option value="Observation">Observation</option>
                    <option value="Restoration">Restoration</option>
                    <option value="Patrol">Patrol</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Difficulty</label>
                <select
                    value={item.difficulty || 'Easy'}
                    onChange={(e) => onChange({ difficulty: e.target.value })}
                    className="w-full bg-surface-foam border border-slate-200 rounded-xl p-4 text-ocean-depth appearance-none"
                >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                </select>
            </div>

            <InputGroup label="XP Reward" type="number" value={item.xp_reward} onChange={(v: string) => onChange({ xp_reward: parseInt(v) })} />
            <InputGroup label="Shell Reward" type="number" value={item.shell_reward} onChange={(v: string) => onChange({ shell_reward: parseInt(v) })} />

            <div className="md:col-span-2">
                <InputGroup label="Description" type="textarea" value={item.description} onChange={(v: string) => onChange({ description: v })} />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                <select
                    value={item.status || 'Available'}
                    onChange={(e) => onChange({ status: e.target.value })}
                    className="w-full bg-surface-foam border border-slate-200 rounded-xl p-4 text-ocean-depth appearance-none"
                >
                    <option value="Available">Available</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>
        </>
    );
}

function NewsFormFields({ item, onChange }: any) {
    return (
        <>
            <div className="md:col-span-2">
                <InputGroup label="Headline Title" value={item.title} onChange={(v: string) => onChange({ title: v })} />
            </div>
            <InputGroup label="Image URL" value={item.image_url} onChange={(v: string) => onChange({ image_url: v })} />
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                <select
                    value={item.category || 'Update'}
                    onChange={(e) => onChange({ category: e.target.value })}
                    className="w-full bg-surface-foam border border-slate-200 rounded-xl p-4 text-ocean-depth appearance-none"
                >
                    <option value="Update">Update</option>
                    <option value="Alert">Alert</option>
                    <option value="Event">Event</option>
                    <option value="Discovery">Discovery</option>
                </select>
            </div>
            <div className="md:col-span-2">
                <InputGroup label="Content Body" type="textarea" value={item.content} onChange={(v: string) => onChange({ content: v })} />
            </div>
        </>
    );
}

function SpecimenFormFields({ item, onChange }: any) {
    return (
        <>
            <InputGroup label="Common Name" value={item.name} onChange={(v: string) => onChange({ name: v })} />
            <InputGroup label="Latin Name" value={item.latin_name} onChange={(v: string) => onChange({ latin_name: v })} />
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rarity</label>
                <select
                    value={item.rarity || 'Common'}
                    onChange={(e) => onChange({ rarity: e.target.value })}
                    className="w-full bg-surface-foam border border-slate-200 rounded-xl p-4 text-ocean-depth appearance-none"
                >
                    <option value="Common">Common</option>
                    <option value="Uncommon">Uncommon</option>
                    <option value="Rare">Rare</option>
                    <option value="Legendary">Legendary</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                <select
                    value={item.status || 'Locked'}
                    onChange={(e) => onChange({ status: e.target.value })}
                    className="w-full bg-surface-foam border border-slate-200 rounded-xl p-4 text-ocean-depth appearance-none"
                >
                    <option value="Locked">Locked</option>
                    <option value="Discovered">Discovered</option>
                    <option value="Scanning">Scanning</option>
                </select>
            </div>
            <div className="md:col-span-2">
                <InputGroup label="Description" type="textarea" value={item.description} onChange={(v: string) => onChange({ description: v })} />
            </div>
            <InputGroup label="Image URL" value={item.image_url} onChange={(v: string) => onChange({ image_url: v })} />
            <InputGroup label="Discovery Location" value={item.discovery_location} onChange={(v: string) => onChange({ discovery_location: v })} />
        </>
    );
}
