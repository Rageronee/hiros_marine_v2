import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

type SoundZone = 'Menu' | 'Pantura' | 'SouthCoast' | 'Silence';

interface SoundscapeState {
    currentZone: SoundZone;
    setZone: (zone: SoundZone) => void;
    isMuted: boolean;
    toggleMute: () => void;
}

const SoundscapeContext = createContext<SoundscapeState | undefined>(undefined);

// Mock Audio Tracks - In a real app, these would be local assets
const TRACKS = {
    Menu: 'https://cdn.freesound.org/previews/573/573523_1603649-lq.mp3', // Sci-fi hum
    Pantura: 'https://cdn.freesound.org/previews/396/396024_5121236-lq.mp3', // Dirty machine/waves
    SouthCoast: 'https://cdn.freesound.org/previews/175/175953_3174151-lq.mp3', // Deep ocean roar
    Silence: ''
};

export function SoundscapeProvider({ children }: { children: React.ReactNode }) {
    const [currentZone, setCurrentZone] = useState<SoundZone>('Menu');
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
        }

        const audio = audioRef.current;

        // Fade out
        const fadeOut = setInterval(() => {
            if (audio.volume > 0.1) {
                audio.volume -= 0.1;
            } else {
                clearInterval(fadeOut);
                // Switch track
                if (currentZone === 'Silence') {
                    audio.pause();
                } else {
                    audio.src = TRACKS[currentZone];
                    if (!isMuted) {
                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                console.log("Audio play prevented:", error);
                            });
                        }
                    }
                    // Fade in
                    const fadeIn = setInterval(() => {
                        if (audio.volume < 0.4) { // Max volume 0.4
                            audio.volume += 0.1;
                        } else {
                            clearInterval(fadeIn);
                        }
                    }, 100);
                }
            }
        }, 100);

        return () => clearInterval(fadeOut);
    }, [currentZone]);

    useEffect(() => {
        if (audioRef.current) {
            if (isMuted) audioRef.current.pause();
            else if (currentZone !== 'Silence' && audioRef.current.src) audioRef.current.play().catch(e => console.log(e));
        }
    }, [isMuted]);

    const toggleMute = () => setIsMuted(prev => !prev);
    const setZone = (zone: SoundZone) => {
        if (zone !== currentZone) setCurrentZone(zone);
    };

    return (
        <SoundscapeContext.Provider value={{ currentZone, setZone, isMuted, toggleMute }}>
            {children}
        </SoundscapeContext.Provider>
    );
}

export function useSoundscape() {
    const context = useContext(SoundscapeContext);
    if (context === undefined) {
        throw new Error('useSoundscape must be used within a SoundscapeProvider');
    }
    return context;
}
