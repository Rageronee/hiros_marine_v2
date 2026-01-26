import React, { createContext, useContext, useState, useEffect } from 'react';

interface Gadge {
    id: string;
    name: string;
    description: string;
    icon: string; // URL or Lucide icon name
    unlocked: boolean;
    rarity: 'Common' | 'Rare' | 'Legendary' | 'Mythic';
}

interface GameState {
    xp: number;
    level: number;
    shells: number; // Currency
    rank: string;
    badges: Gadge[];
    stats: {
        missionsCompleted: number;
        plasticRemovedKg: number;
        coastlineProtectedKm: number;
    };
    addXp: (amount: number) => void;
    addShells: (amount: number) => void;
}

const GamificationContext = createContext<GameState | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const [xp, setXp] = useState(1250);
    const [shells, setShells] = useState(450);
    const [level, setLevel] = useState(1);
    const [rank, setRank] = useState('Observer');

    // Derived state for level calculation
    useEffect(() => {
        const newLevel = Math.floor(xp / 1000) + 1;
        if (newLevel > level) {
            setLevel(newLevel);
            // TODO: Play level up sound / Toast
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
        <GamificationContext.Provider value={{ xp, level, shells, rank, badges, stats, addXp, addShells }}>
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
