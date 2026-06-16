import axios from "axios";
import * as cheerio from "cheerio";

export default async function scrapeCapeMarkets(seenUrls) {
  console.log("\n🧺 Running Scraper: Cape Markets (Cape Town)...");
  const rawEvents = [];
  const localSeenNames = new Set();

  try {
  // 1. Fetch the main events list directly from the homepage!
    const listUrl = "https://capemarkets.co.za/";
    console.log(`   ⏳ Fetching main calendar: ${listUrl}`);

    const listResponse = await axios.get(listUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    const $list = cheerio.load(listResponse.data);
    const eventLinks = [];

    // 2. Find links pointing to individual events, markets, or special pop-ups
    // 🚨 Added /editors-pick/ to grab special weekend festivals!
    $list('a[href*="/events/"], a[href*="/markets/"], a[href*="/editors-pick/"]').each((i, el) => {
      let link = $list(el).attr('href');

      if (!link) return;
      if (!link.startsWith("http")) link = "https://capemarkets.co.za" + link;

      // Clean the list: Exclude generic calendar views, categories, and tags
      if (
        !eventLinks.includes(link) && 
        !link.includes('/category/') && 
        !link.includes('/tag/') &&
        !link.includes('?tribe_') &&
        link.length > 35 
      ) {
        eventLinks.push(link);
      }
    });

    console.log(`   📍 Found ${eventLinks.length} potential markets. Investigating...`);

    // 3. Visit each market page
    for (const link of eventLinks) {
      if (seenUrls.has(link)) continue;

      try {
        const pageRes = await axios.get(link, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          timeout: 8000
        });
        const $ = cheerio.load(pageRes.data);

        // --- 🎯 EXTRACT TITLE ---
        let eventName = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim();
        eventName = eventName.replace(/\s*[\|-]\s*CapeMarkets.*$/i, '').trim(); 
        
        if (!eventName || localSeenNames.has(eventName)) continue;

        let exactLocation = "Cape Town";
        let baseTown = "";
        let eventDate = new Date().toISOString();
        let endDate = eventDate;
        
        // --- 🎯 STRATEGY A: THE BRACKET SNIPE (Cleans title & saves base town) ---
        const locationMatch = eventName.match(/\(([^)]+)\)/);
        if (locationMatch) {
            baseTown = locationMatch[1].trim(); 
            eventName = eventName.replace(/\s*\([^)]+\)/, '').trim(); 
        }

        // --- 🎯 STRATEGY B: THE GOOGLE MAPS SNIPER (Hyper-Precise) ---
        // Look for any link pointing to Google Maps
        const mapLink = $('a[href*="maps.google"], a[href*="goo.gl/maps"]').attr('href');
        if (mapLink) {
            try {
                // We extract the exact search query from the URL (e.g., ?q=123+Main+Street)
                const url = new URL(mapLink);
                const qParam = url.searchParams.get('q') || url.searchParams.get('query');
                if (qParam) {
                    exactLocation = decodeURIComponent(qParam).replace(/\+/g, ' ').replace(/\s+/g, ' ').trim();
                }
            } catch (e) {
                // Catch malformed URLs silently
            }
        }

        // --- 🎯 STRATEGY C: ARTICLE TEXT PARSING ---
        // If the map didn't have an address, look for "Address:" or "Venue:" in the text
        if (exactLocation === "Cape Town" || exactLocation === "") {
            const articleText = $('.entry-content, article, main').text().replace(/\s+/g, ' ');
            // Grabs 10 to 80 characters after "Address:" or "Venue:"
            const addressMatch = articleText.match(/(?:Address|Location|Venue|Where):\s*([A-Za-z0-9\s,]{10,80})/i);
                                 
            if (addressMatch && addressMatch[1].trim().length > 5) {
                exactLocation = addressMatch[1].trim().split(/(?:\.|\n|Tel:|Email:|Time:)/)[0]; // Stop at the next period or field
            }
        }

        // --- 🎯 STRATEGY D: HIDDEN JSON-LD DATA ---
        const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
        for (const script of jsonLdScripts) {
          try {
            const data = JSON.parse($(script).html());
            const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
            
            for (const item of items) {
              if (item['@type'] === 'Event') {
                if (item.location?.address?.streetAddress && exactLocation === "Cape Town") {
                    exactLocation = `${item.location.name ? item.location.name + ', ' : ''}${item.location.address.streetAddress}`;
                }
                if (item.startDate) eventDate = new Date(item.startDate).toISOString();
                if (item.endDate) endDate = new Date(item.endDate).toISOString();
              }
            }
          } catch (e) {}
        }

        // Fallback to the base town if all hyper-specific strategies failed
        if (exactLocation === "Cape Town" && baseTown !== "") {
            exactLocation = baseTown;
        }

        // Clean up any trailing junk characters
        exactLocation = exactLocation.replace(/[,-\s]+$/, '').trim();

        // --- 🎯 EXTRACT RICH DESCRIPTION & BANNER ---
        let description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content');
                          
        if (!description || description.length < 20) {
            // Fallback: Grab the first chunk of text from the event description box
            description = $('.tribe-events-single-event-description').text().trim().substring(0, 300) + "...";
        }

        // Grab the high-res Open Graph image for the banner
        let bannerImage = $('meta[property="og:image"]').attr('content') || null;

        seenUrls.add(link);
        localSeenNames.add(eventName);

        console.log(`   ✨ Found market: ${eventName} (📍 ${exactLocation})`);

        rawEvents.push({
          title: eventName,
          description: description || `A lovely market located in ${exactLocation}.`,
          date: eventDate,
          end_date: endDate,
          location_text: exactLocation,
          banner_url: bannerImage,
          ticket_url: link,
          lowest_price: 0, // Markets are usually free entry
          source_url: link
        });

      } catch (err) {
        // Silently catch timeouts for individual pages
      }

      // 🚨 Polite delay
      await new Promise(r => setTimeout(r, 1000));
    }

  } catch (error) {
    console.error("❌ Failed to scrape Cape Markets:", error.message);
  }

  return rawEvents;
}