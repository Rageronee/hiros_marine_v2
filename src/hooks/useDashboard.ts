import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { News, Mission, Location } from '../types';

export function useDashboard() {
    const [news, setNews] = useState<News[]>([]);
    const [activeQuests, setActiveQuests] = useState<Mission[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Fetch News
                const { data: newsData, error: newsError } = await supabase
                    .from('news')
                    .select('*')
                    .limit(3)
                    .order('created_at', { ascending: false });

                if (newsError) throw newsError;

                // Fetch Missions
                const { data: questData, error: questError } = await supabase
                    .from('missions')
                    .select('*')
                    .eq('status', 'Available')
                    .limit(2);

                if (questError) throw questError;

                // Fetch Locations
                const { data: locationData, error: locationError } = await supabase
                    .from('locations')
                    .select('*')
                    .limit(4);

                if (locationError) throw locationError;

                setNews(newsData || []);
                setActiveQuests(questData || []);
                setLocations(locationData || []);
            } catch (err: any) {
                console.error('Error fetching dashboard data:', err);
                setError(err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return { news, activeQuests, locations, loading, error };
}
