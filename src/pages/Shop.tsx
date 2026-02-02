
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useGamification } from '../contexts/GamificationContext';
import { ShoppingBag, Star, Shield, Award, Sparkles, Lock, Check, Loader2 } from 'lucide-react';

interface ShopItem {
    id: string;
    name: string;
    type: 'Frame' | 'Title' | 'Badge';
    cost: number;
    description: string;
    image_url: string;
    rarity: string;
}

interface UserInventory {
    item_id: string;
    equipped: boolean;
}

export default function Shop() {
    const { shells, refreshProfile, equippedFrame, equippedTitle } = useGamification();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'Frame' | 'Title' | 'Badge'>('Frame');
    const [purchasing, setPurchasing] = useState<string | null>(null);

    // Fetch Shop Items
    const { data: items = [], isLoading: loadingItems } = useQuery({
        queryKey: ['shop_items'],
        queryFn: async () => {
            const { data, error } = await supabase.from('shop_items').select('*');
            if (error) throw error;
            return data as ShopItem[];
        }
    });

    // Fetch User Inventory
    const { data: inventory = [] } = useQuery({
        queryKey: ['user_inventory'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data, error } = await supabase.from('user_inventory').select('item_id, equipped').eq('user_id', user.id);
            if (error) throw error;
            return data as UserInventory[];
        }
    });

    const ownedItemIds = new Set(inventory.map(i => i.item_id));

    const handlePurchase = async (item: ShopItem) => {
        if (shells < item.cost) {
            alert("Insufficient Shells!");
            return;
        }

        setPurchasing(item.id);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            // 1. Deduct Shells (Optimistic UI handled by context refresh usually, but we can animate)
            // Ideally, we'd have a DB function to handle transaction safely. 
            // For now, client-side check + insert.

            // Insert into inventory
            const { error: invError } = await supabase.from('user_inventory').insert({
                user_id: user.id,
                item_id: item.id
            });
            if (invError) throw invError;

            // Deduct shells (Manual update for now, trigger likely handles this in real app)
            await supabase.from('players').update({ shells: shells - item.cost }).eq('id', user.id); // This is unsafe in prod but fine for proto

            await queryClient.invalidateQueries({ queryKey: ['user_inventory'] });
            refreshProfile(); // Refresh context-bound shells

        } catch (error: any) {
            console.error("Purchase failed:", error);
            alert("Purchase failed: " + error.message);
        } finally {
            setPurchasing(null);
        }
    };

    const handleEquip = async (item: ShopItem) => {
        setPurchasing(item.id);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const updateField = item.type === 'Frame' ? 'equipped_frame' :
                item.type === 'Title' ? 'equipped_title' : null;

            if (updateField) {
                const { error } = await supabase.from('players').update({ [updateField]: item.id }).eq('id', user.id);
                if (error) throw error;
                await refreshProfile();
            }
        } catch (error: any) {
            console.error("Equip failed:", error);
            alert("Equip failed: " + error.message);
        } finally {
            setPurchasing(null);
        }
    };

    const filteredItems = items.filter(item => item.type === activeTab);

    return (
        <div className="h-full w-full p-4 lg:p-8 overflow-y-auto custom-scrollbar bg-slate-950 relative">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-display font-black text-white flex items-center gap-3">
                        <ShoppingBag className="text-cyan-400" size={32} />
                        Black Market
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Exclusive gear for elite operatives.</p>
                </div>

                <div className="flex items-center gap-2 px-5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <Star className="text-amber-400 fill-amber-400" size={18} />
                    <span className="text-xl font-black text-amber-400">{shells.toLocaleString()}</span>
                    <span className="text-xs font-bold text-amber-500/60 uppercase tracking-wider">Shells</span>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-white/5 pb-1">
                {['Frame', 'Title', 'Badge'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-3 px-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-cyan-400' : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        {tab}s
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loadingItems ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-cyan-400" size={48} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
                    {filteredItems.length === 0 ? (
                        <div className="col-span-full py-20 text-center opacity-50">
                            <Lock className="mx-auto mb-4" size={48} />
                            <p className="uppercase tracking-widest font-bold">No Items Available</p>
                        </div>
                    ) : (
                        filteredItems.map(item => {
                            const isOwned = ownedItemIds.has(item.id);
                            const canAfford = shells >= item.cost;

                            return (
                                <div key={item.id} className={`group relative bg-slate-900 border ${item.rarity === 'Legendary' ? 'border-amber-500/30' : 'border-white/5'} rounded-3xl overflow-hidden hover:border-cyan-500/30 transition-all hover:shadow-2xl hover:-translate-y-1`}>
                                    {/* Rarity Stripe */}
                                    <div className={`absolute top-0 inset-x-0 h-1 ${item.rarity === 'Legendary' ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' :
                                        item.rarity === 'Rare' ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' :
                                            'bg-slate-700'
                                        }`}></div>

                                    <div className="p-6 flex flex-col items-center text-center h-full">
                                        <div className={`w-32 h-32 mb-6 rounded-full flex items-center justify-center relative ${item.rarity === 'Legendary' ? 'bg-amber-500/5' : 'bg-slate-800'
                                            }`}>
                                            {/* Preview Placeholder */}
                                            {item.type === 'Frame' && <div className="absolute inset-2 border-4 border-dashed border-slate-600 rounded-full opacity-50"></div>}
                                            {item.type === 'Title' && <Award size={48} className={item.rarity === 'Legendary' ? 'text-amber-400' : 'text-slate-400'} />}
                                            {item.type === 'Badge' && <Shield size={48} className={item.rarity === 'Legendary' ? 'text-amber-400' : 'text-slate-400'} />}
                                            {item.type === 'Frame' && <Sparkles size={48} className={item.rarity === 'Legendary' ? 'text-amber-400' : 'text-slate-400'} />}
                                        </div>

                                        <h3 className="text-xl font-display font-black text-white mb-2">{item.name}</h3>
                                        <p className="text-xs text-slate-400 mb-6 line-clamp-2 min-h-[2.5em]">{item.description}</p>

                                        <div className="mt-auto w-full">
                                            {isOwned ? (
                                                (() => {
                                                    const isEquipped = (item.type === 'Frame' && equippedFrame === item.id) ||
                                                        (item.type === 'Title' && equippedTitle === item.id);

                                                    return (
                                                        <button
                                                            onClick={isEquipped ? undefined : () => handleEquip(item)}
                                                            disabled={isEquipped || purchasing === item.id}
                                                            className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 border ${isEquipped
                                                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 cursor-default'
                                                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                                                }`}
                                                        >
                                                            {purchasing === item.id ? <Loader2 size={16} className="animate-spin" /> : (
                                                                <>
                                                                    {isEquipped ? <Check size={16} /> : <Shield size={16} />}
                                                                    {isEquipped ? 'Equipped' : 'Equip'}
                                                                </>
                                                            )}
                                                        </button>
                                                    );
                                                })()
                                            ) : (
                                                <button
                                                    onClick={() => handlePurchase(item)}
                                                    disabled={!canAfford || purchasing === item.id}
                                                    className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${canAfford
                                                        ? 'bg-white text-slate-900 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {purchasing === item.id ? <Loader2 size={16} className="animate-spin" /> : (
                                                        <>
                                                            {item.cost} <Star size={12} className="fill-current" />
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
