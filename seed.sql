-- ================================================================
-- HIRO MARINE // SEED DATA PROTOCOL
-- ================================================================
-- INSTRUCTIONS:
-- 1. Run 'schema.sql' FIRST to create tables and policies.
-- 2. Run this file 'seed.sql' to populate the database with content.
-- ================================================================
----------------------------------------------------------------
-- 1. NEWS (6 Items)
----------------------------------------------------------------
INSERT INTO "public"."news" (
        "title",
        "category",
        "image_url",
        "content",
        "created_at"
    )
VALUES (
        'Hawksbill Turtles Return',
        'Positive News',
        'https://images.unsplash.com/photo-1518467166778-b88f373ffec7?q=80',
        'After a five-year absence, local conservationists report a record number of nesting sites along the southern coast.',
        NOW()
    ),
    (
        'Bleaching Event Detected',
        'Alert',
        'https://images.unsplash.com/photo-1583212292454-1fe386d22584?q=80',
        'High water temperatures in the Java Sea Sector A-4 have triggered early warning systems. Divers are advised to monitor coral health.',
        NOW() - INTERVAL '2 days'
    ),
    (
        'New Ghost Net Hunters',
        'Community',
        'https://images.unsplash.com/photo-1621451537084-482c73073a0f?q=80',
        'The Maung Laut clan has successfully cleared 500kg of debris this week alone, setting a new regional record.',
        NOW() - INTERVAL '5 days'
    ),
    (
        'Sonar Anomaly Investigated',
        'Alert',
        'https://images.unsplash.com/photo-1551244072-5d12893278ab?q=80',
        'Unusual sonar readings have been detected near the Sunda Strait. Likely a playful pod of dolphins.',
        NOW() - INTERVAL '1 week'
    ),
    (
        'Giant Manta Sighting',
        'Positive News',
        'https://images.unsplash.com/photo-1498623116890-37e912163d5d?q=80',
        'A group of giant oceanic manta rays has been spotted feeding near Nusa Penida.',
        NOW() - INTERVAL '2 weeks'
    ),
    (
        'Plastic Free Initiative',
        'Community',
        'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?q=80',
        'Over 10,000 volunteers participated in the coastal cleanup, removing tons of plastic waste.',
        NOW() - INTERVAL '3 weeks'
    );
----------------------------------------------------------------
-- 2. LOCATIONS (4 Items)
----------------------------------------------------------------
INSERT INTO "public"."locations" (
        "name",
        "region",
        "image_url",
        "water_clarity",
        "biodiversity_score",
        "current_condition",
        "description"
    )
VALUES (
        'Menjangan Island',
        'West Bali National Park',
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80',
        9.5,
        'High',
        'Calm',
        'A pristine sanctuary offering wall diving with spectacular visibility.'
    ),
    (
        'Karimunjawa',
        'Central Java',
        'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?q=80',
        8.2,
        'High',
        'Calm',
        'The Caribbean of Java. Experience turquoise lagoons and shark conservation pools.'
    ),
    (
        'Raja Ampat',
        'West Papua',
        'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80',
        9.8,
        'Critical',
        'Calm',
        'The global epicenter of marine biodiversity. Hidden lagoons and limestone karsts.'
    ),
    (
        'Bunaken',
        'North Sulawesi',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80',
        9.0,
        'High',
        'Rough',
        'Famous for its dramatic drop-offs and vertical coral walls.'
    );
----------------------------------------------------------------
-- 3. SPECIMENS (5 Items)
----------------------------------------------------------------
INSERT INTO "public"."specimens" (
        "name",
        "latin_name",
        "type",
        "status",
        "description",
        "habitat",
        "locked",
        "required_level",
        "image_url",
        "size",
        "depth",
        "rarity",
        "discovery_location"
    )
VALUES (
        'Javan Rhinoceros',
        'Rhinoceros sondaicus',
        'Fauna',
        'Critical',
        'One of the rarest large mammals on earth.',
        'Ujung Kulon National Park',
        true,
        5,
        'https://images.unsplash.com/photo-1593845892520-2c700cb75fb7?q=80',
        '3.1 - 3.2m',
        'Land/Coastal',
        'Mythic',
        'Ujung Kulon'
    ),
    (
        'Hawksbill Turtle',
        'Eretmochelys imbricata',
        'Fauna',
        'Critical',
        'Critically endangered sea turtle known for their narrow, pointed beak.',
        'Karimunjawa / Thousand Islands',
        true,
        3,
        'https://images.unsplash.com/photo-1437622643429-be0c07ea7cda?q=80',
        '1m',
        'Surface - 20m',
        'Legendary',
        'Karimunjawa'
    ),
    (
        'Giant Clam',
        'Tridacna gigas',
        'Fauna',
        'Vulnerable',
        'The largest living bivalve mollusc.',
        'Coral Reefs',
        false,
        1,
        'https://images.unsplash.com/photo-1534234828569-1f481c15f93b?q=80',
        '1.2m',
        'Shallow Reefs',
        'Rare',
        'Raja Ampat'
    ),
    (
        'Dugong',
        'Dugong dugon',
        'Fauna',
        'Vulnerable',
        'Marine mammal. Strict herbivore. Dependent on seagrass beds.',
        'Baluran National Park',
        true,
        10,
        'https://images.unsplash.com/photo-1570028639259-2f22b82647c9?q=80',
        '3m',
        '1 - 30m',
        'Legendary',
        'Baluran'
    ),
    (
        'Mola Mola',
        'Mola mola',
        'Fauna',
        'Vulnerable',
        'The ocean sunfish is one of the heaviest known bony fishes.',
        'Nusa Penida',
        true,
        7,
        'https://images.unsplash.com/photo-1582967788606-a171f1080ca8?q=80',
        '1.8 - 3.3m',
        'Surface - 600m',
        'Legendary',
        'Crystal Bay'
    );
----------------------------------------------------------------
-- 4. MISSIONS (4 Items)
----------------------------------------------------------------
INSERT INTO "public"."missions" (
        "title",
        "location",
        "difficulty",
        "type",
        "xp_reward",
        "shell_reward",
        "description",
        "status",
        "deadline"
    )
VALUES (
        'Ghost Net Hunter',
        'Kepulauan Seribu, Jakarta',
        'Hard',
        'Cleanup',
        500,
        200,
        'Identify and report abandoned fishing nets entangled in the coral reef sector A-4.',
        'Available',
        '24h remaining'
    ),
    (
        'Mangrove Wall Initiative',
        'Muara Gembong, Bekasi',
        'Medium',
        'Restoration',
        300,
        150,
        'Plant 10 mangrove seedlings and upload geotagged photos.',
        'Active',
        '3 days remaining'
    ),
    (
        'Rhino Patrol Interface',
        'Ujung Kulon Sector 7',
        'Expert',
        'Patrol',
        1000,
        500,
        'Patrol the coastline boundary for signs of illegal trawling.',
        'Available',
        NULL
    ),
    (
        'Reef Monitor Alpha',
        'Bunaken National Park',
        'Easy',
        'Survey',
        150,
        50,
        'Conduct a 10-minute visual survey of the shallow reef.',
        'Available',
        '12h remaining'
    );
----------------------------------------------------------------
-- 5. CLANS (5 Items)
----------------------------------------------------------------
INSERT INTO "public"."clans" ("name", "province", "score", "members", "color")
VALUES (
        'Maung Laut',
        'Jawa Barat',
        12500,
        2450,
        'text-blue-400'
    ),
    (
        'Bhatara',
        'Jawa Tengah',
        11200,
        2100,
        'text-yellow-400'
    ),
    (
        'Sura Buaya',
        'Jawa Timur',
        13800,
        2800,
        'text-green-400'
    ),
    (
        'Jawara',
        'DKI Jakarta',
        9800,
        1500,
        'text-red-400'
    ),
    ('Badak', 'Banten', 8900, 1200, 'text-gray-400');