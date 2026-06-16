import axios from "axios";
import * as cheerio from "cheerio";

export default async function scrapeRunningCalendar(seenUrls) {
  console.log("\n👟 Running Scraper: Running Calendar (Cape Town)...");
  const rawEvents = [];
  const localSeenNames = new Set();
  
  try {
    // 1. Fetch the main Cape Town directory page
    const listUrl = "https://runningcalendar.co.za/races/calendar/area/cape-town";
    console.log(`   ⏳ Fetching main calendar: ${listUrl}`);
    
    const listResponse = await axios.get(listUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });

    const $list = cheerio.load(listResponse.data);
    const eventLinks = [];

    // 2. Find all links that point to an individual event page
    $list('a[href*="/events/"]').each((i, el) => {
      let link = $list(el).attr('href');
      // Ensure it's a full URL
      if (!link.startsWith("http")) link = "https://runningcalendar.co.za" + link;
      
      // Keep our list clean of duplicates
      if (!eventLinks.includes(link)) {
        eventLinks.push(link);
      }
    });

    console.log(`   📍 Found ${eventLinks.length} potential races. Investigating...`);

    // 3. Visit each event page to extract the juicy details
    // (We use a standard for-loop so we can politely pause between requests)
    for (const link of eventLinks) {
      if (seenUrls.has(link)) continue; // Skip if it's already in Supabase
      
      try {
        const pageRes = await axios.get(link, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        const $ = cheerio.load(pageRes.data);

        // Many modern sites use JSON-LD for SEO. Let's look for it first!
        const jsonLdScript = $('script[type="application/ld+json"]').html();
        let item = null;
        
        if (jsonLdScript) {
            try { item = JSON.parse(jsonLdScript); } catch(e) {}
        }

        // If it's an array, grab the Event object
        if (Array.isArray(item)) {
            item = item.find(i => i["@type"] === "Event") || item[0];
        }

        // Fallback: If no JSON-LD, grab text straight from the HTML headers
        const eventName = item?.name || $('h1').first().text().trim() || "Unknown Race";
        
        if (localSeenNames.has(eventName)) continue;
        
        seenUrls.add(link);
        localSeenNames.add(eventName);

        console.log(`   ✨ Found new race: ${eventName}`);

// --- LOCATION SCRAPING ---
        let exactLocation = "Cape Town";

        // 1. Try to get a specific name or street address from the hidden JSON
        if (item?.location?.name && item.location.name !== "Cape Town") {
            exactLocation = item.location.name;
        } else if (item?.location?.address?.streetAddress) {
            exactLocation = item.location.address.streetAddress;
        } 
        
        // 2. If it still just says "Cape Town", scrape the visible page text!
        if (exactLocation === "Cape Town") {
            const pageText = $('body').text();
            // Look for the specific formatting the website uses
            const addressMatch = pageText.match(/(?:Event Venue|Start Address|Address):\s*(.*?)(?:\n|Cape Town|Western Cape|ZA)/i);
            
            if (addressMatch && addressMatch[1].trim().length > 3) {
                // Clean up any trailing commas or trailing hyphens
                exactLocation = addressMatch[1].trim().replace(/[,-\s]+$/, ''); 
            }
        }

        // Extracting raw strings to send to the Boss
        rawEvents.push({
          title: eventName,
          description: item?.description || $('meta[name="description"]').attr('content') || "A running event in Cape Town.",
          date: item?.startDate || new Date().toISOString(), 
          end_date: item?.endDate || item?.startDate || new Date().toISOString(),
          location_text: exactLocation, // 🚨 Updated to use our new variable!
          banner_url: item?.image || null,
          ticket_url: link,
          lowest_price: 0, 
          source_url: link
        });

      } catch (err) {
        console.log(`   ⚠️ Failed to load race page: ${link}`);
      }

      // 🚨 CRITICAL: Polite delay. We don't want to accidentally DDoS a local running site!
      await new Promise(r => setTimeout(r, 1500)); 
    }

  } catch (error) {
    console.error("❌ Failed to scrape Running Calendar:", error.message);
  }

  return rawEvents;
}