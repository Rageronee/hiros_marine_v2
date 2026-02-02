import React, { createContext, useContext, useState, useEffect } from 'react';

interface Gadge {
    id: string;
    name: string;
    description: string;
    icon: string; // URL or Lucide icon name
    unlocked: boolean;
    rarity: 'Common' | 'Rare' | 'Legendary' | 'Mythic';
}

import { supabase } from '../lib/supabase';

// ... existing imports

interface GameState {
    xp: number;
    level: number;
    shells: number; // Currency
    rank: string;
    badges: Gadge[];
    equippedFrame: string | null;
    equippedTitle: string | null;
    stats: {
        missionsCompleted: number;
        plasticRemovedKg: number;
        coastlineProtectedKm: number;
    };
    addXp: (amount: number) => void;
    addShells: (amount: number) => void;
    refreshProfile: () => Promise<void>;
}

const GamificationContext = createContext<GameState | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const [xp, setXp] = useState(0);
    const [shells, setShells] = useState(0);
    const [level, setLevel] = useState(1);
    const [rank, setRank] = useState('Novice');
    const [equippedFrame, setEquippedFrame] = useState<string | null>(null);
    const [equippedTitle, setEquippedTitle] = useState<string | null>(null);

    // Fetch real data on mount
    const refreshProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('players').select('xp, shells, level, rank_title, equipped_frame, equipped_title').eq('id', user.id).single();
            if (data) {
                setXp(data.xp || 0);
                setShells(data.shells || 0);
                setLevel(data.level || 1);
                setRank(data.rank_title || 'Novice');
                setEquippedFrame(data.equipped_frame || null);
                setEquippedTitle(data.equipped_title || null);
            }
        }
    };

    useEffect(() => {
        refreshProfile();
    }, []);

    // Derived state for level calculation (Legacy/Local updates)
    useEffect(() => {
        const newLevel = Math.floor(xp / 1000) + 1;
        // Only update if calculated level is higher than current (and sync to DB ideally)
        if (newLevel > level) {
            // We can keep local state in sync or rely on DB. 
            // For now, let's allow local calculation to drive UI until refresh
            setLevel(newLevel);
        }

        if (newLevel >= 1 && newLevel < 5) setRank('Observer');
        else if (newLevel >= 5 && newLevel < 10) setRank('Guardian');
        else if (newLevel >= 10) setRank('Legend');

    }, [xp, level]);

    const [badges] = useState<Gadge[]>([
        {
            id: 'b1',
            name: 'Pantura Survivor',
            description: 'Completed 50 missions in the Red Zone.',
            icon: 'Mask',
            unlocked: true,
            rarity: 'Legendary'
        },
        {
            id: 'b2',
            name: 'Son of Southern Queen',
            description: 'Safe observation in the Southern Coast.',
            icon: 'Crown',
            unlocked: false,
            rarity: 'Mythic'
        },
        {
            id: 'b3',
            name: 'Mangrove Planter',
            description: 'Planted 100 Mangroves.',
            icon: 'Sprout',
            unlocked: true,
            rarity: 'Rare'
        }
    ]);

    const [stats] = useState({
        missionsCompleted: 12,
        plasticRemovedKg: 45.5,
        coastlineProtectedKm: 0.2
    });

    const addXp = (amount: number) => setXp(prev => prev + amount);
    const addShells = (amount: number) => setShells(prev => prev + amount);

    return (
        <GamificationContext.Provider value={{ xp, level, shells, rank, badges, stats, addXp, addShells, refreshProfile, equippedFrame, equippedTitle }}>
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
}
