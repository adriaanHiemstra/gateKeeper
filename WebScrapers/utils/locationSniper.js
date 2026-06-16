export default function extractPreciseLocation($, fallbackTown = "Cape Town") {
    let exactLocation = "";

    // --- 🎯 STRATEGY 1: THE GOOGLE MAPS SNIPER (Most Precise) ---
    const mapLink = $('a[href*="maps.google"], a[href*="goo.gl/maps"]').attr('href');
    if (mapLink) {
        try {
            const url = new URL(mapLink);
            const qParam = url.searchParams.get('q') || url.searchParams.get('query');
            if (qParam) {
                exactLocation = decodeURIComponent(qParam).replace(/\+/g, ' ').replace(/\s+/g, ' ').trim();
            }
        } catch (e) {
            // Silently skip malformed URLs
        }
    }

    // --- 🎯 STRATEGY 2: HIDDEN SCHEMA.ORG JSON-LD (Highly Accurate) ---
    if (!exactLocation) {
        const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
        for (const script of jsonLdScripts) {
            try {
                const data = JSON.parse($(script).html());
                const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
                
                for (const item of items) {
                    const type = item['@type'];
                    if (type === 'Event' || type === 'MusicEvent') {
                        if (item.location?.address?.streetAddress) {
                            exactLocation = `${item.location.name ? item.location.name + ', ' : ''}${item.location.address.streetAddress}`;
                        } else if (item.location?.name) {
                            exactLocation = item.location.name;
                        }
                    }
                }
            } catch (e) {}
        }
    }

    // --- 🎯 STRATEGY 3: RAW TEXT PARSING (The Catch-All) ---
    if (!exactLocation) {
        const articleText = $('body').text().replace(/\s+/g, ' ');
        const addressMatch = articleText.match(/(?:Address|Location|Venue|Where):\s*([A-Za-z0-9\s,]{10,80})/i);
                             
        if (addressMatch && addressMatch[1].trim().length > 5) {
            // Split at common stopping points like periods, phone numbers, or times
            exactLocation = addressMatch[1].trim().split(/(?:\.|\n|Tel:|Email:|Time:|- |\|)/)[0]; 
        }
    }

    // --- FINAL CLEANUP ---
    if (!exactLocation || exactLocation.length < 3) {
        exactLocation = fallbackTown;
    }

    return exactLocation.replace(/[,-\s]+$/, '').trim();
}