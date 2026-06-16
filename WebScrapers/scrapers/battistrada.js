import axios from "axios";
import * as cheerio from "cheerio";
//import extractPreciseLocation from "./locationSniper.js";


export default async function scrapeBattistrada(seenUrls) {
  console.log("\n🚴 Running Scraper: Battistrada (Cape Town & Western Cape Cycling)...");
  const rawEvents = [];
  const localSeenNames = new Set();
  
  try {
    // 1. Fetch the main Western Cape cycling directory
    const listUrl = "https://battistrada.com/en/cycling-calendar/south-africa/western-cape-province/";
    console.log(`   ⏳ Fetching main calendar: ${listUrl}`);
    
    const listResponse = await axios.get(listUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });

    const $list = cheerio.load(listResponse.data);
    const eventLinks = [];

    // 2. Find all links that point to an individual cycling event page
    // Battistrada uses two main URL structures for events
    $list('a[href*="/en/event/"], a[href*="/en/cycling-calendar/edition/"]').each((i, el) => {
      let link = $list(el).attr('href');
      
      // Ensure it's a full URL
      if (!link.startsWith("http")) link = "https://battistrada.com" + link;
      
      // Keep our list clean of duplicates
      if (!eventLinks.includes(link)) {
        eventLinks.push(link);
      }
    });

    console.log(`   📍 Found ${eventLinks.length} potential cycling events. Investigating...`);

    // 3. Visit each event page
    for (const link of eventLinks) {
      if (seenUrls.has(link)) continue; 
      
      try {
        const pageRes = await axios.get(link, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        const $ = cheerio.load(pageRes.data);

        //const exactLocation = extractPreciseLocation($, "Cape Town");

        // --- 🎯 IMPROVED TITLE ---
        let eventName = $('h1').first().text().trim() || "Unknown Cycling Event";
        eventName = eventName.replace(/\s202[4-9]$/, '');

        if (localSeenNames.has(eventName)) continue;

// --- 🎯 HYPER-SPECIFIC LOCATION SCRAPING ---
        let exactLocation = "Western Cape";
        const bodyText = $('body').text();

        // Strategy A: Snipe the auto-generated "departure in" sentence
        // This looks for "departure in [Town], distrik [District]"
        const departureMatch = bodyText.match(/departure in\s+([^,]+)(?:,\s*distrik|,\s*Western Cape)/i);
        if (departureMatch && departureMatch[1].trim().length > 2) {
            exactLocation = departureMatch[1].trim();
        }

        // Strategy B: Exploit their hidden breadcrumb list
        // It almost always goes: South Africa. -> Western Cape. -> District. -> Town.
        if (exactLocation === "Western Cape") {
            const listItems = $('li').map((i, el) => $(el).text().trim()).get();
            const wcIndex = listItems.findIndex(item => item === "Western Cape.");
            
            if (wcIndex !== -1 && listItems.length > wcIndex + 2) {
                // Grab the item 2 steps down from Western Cape (which is the Town)
                let town = listItems[wcIndex + 2].replace('.', '').trim();
                
                // Ensure we didn't accidentally grab a massive paragraph
                if (town.length > 2 && town.length < 30) {
                    exactLocation = town;
                }
            }
        }

        // --- 🎯 IMPROVED BANNER SCRAPING ---
        // Look for the high-quality Open Graph image used for Facebook/WhatsApp sharing
        let bannerImage = $('meta[property="og:image"]').attr('content') || null;
        
        // Fallback: Try to find the first large image in the main content area
        if (!bannerImage) {
            const firstImg = $('img.img-fluid, .event-image img').first().attr('src');
            if (firstImg) {
                // Ensure it's an absolute URL
                bannerImage = firstImg.startsWith('http') ? firstImg : `https://battistrada.com${firstImg}`;
            }
        }

        // Try to find a date in the text
        const dateMatch = $('body').text().match(/(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s\d{1,2}\s[A-Za-z]{3}\s202[4-9]/i);
        const eventDate = dateMatch ? new Date(dateMatch[0]).toISOString() : new Date().toISOString();

        seenUrls.add(link);
        localSeenNames.add(eventName);

        console.log(`   ✨ Found new cycling race: ${eventName} (📍 ${exactLocation})`);

        rawEvents.push({
          title: eventName,
          description: $('meta[name="description"]').attr('content') || `A cycling event starting in ${exactLocation}.`,
          date: eventDate, 
          end_date: eventDate, 
          location_text: exactLocation, 
          banner_url: bannerImage, // 🚨 Now dynamically pulls the high-res image!
          ticket_url: link,
          lowest_price: 0, 
          source_url: link
        });

      } catch (err) {
        // Silently catch 404s or timeouts for individual pages
      }

      // Polite delay
      await new Promise(r => setTimeout(r, 1500)); 
    }

  } catch (error) {
    console.error("❌ Failed to scrape Battistrada:", error.message);
  }

  return rawEvents;
}