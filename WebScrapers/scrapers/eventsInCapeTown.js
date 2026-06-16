import axios from "axios";
import * as cheerio from "cheerio";

// Notice we NO LONGER import Supabase or OpenAI here!
// We also export this function so the "Boss" (index.js) can use it.

export default async function scrapeEventsInCapeTown(seenUrls) {
  console.log("\n🌐 Running Scraper: Events in Cape Town...");
  const rawEvents = [];
  const year = new Date().getFullYear().toString();
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

  for (const month of months) {
    try {
      const response = await axios.post("https://eventsincapetown.com/wp-admin/admin-ajax.php", 
        `action=mec_tile_load_month&mec_year=${year}&mec_month=${month}&atts%5Bid%5D=2445`,
        { timeout: 15000 }
      );

      const $ = cheerio.load(response.data.month || "");
      const events = $('script[type="application/ld+json"]').toArray();

      for (const tag of events) {
        try {
          const item = JSON.parse($(tag).html());
          
          // 1. Check if it's an event and if we've already seen this URL
          if (item["@type"] !== "Event" || seenUrls.has(item.url)) continue;
          seenUrls.add(item.url);

          console.log(`   ✨ Found new event: ${item.name}`);
          
          // 2. Extract our basic info
          const { venue, tickets } = extractVenueAndTickets(item.description || "");
          const desc = cleanDescription(item.description);

          // 3. Push the RAW data to our array. 
          // Notice we DO NOT do Geocoding or AI Tagging here!
          rawEvents.push({
            title: item.name,
            description: desc,
            date: adjustTime(item.startDate),
            end_date: adjustTime(item.endDate),
            location_text: venue,
            banner_url: item.image || null,
            ticket_url: item.url,
            lowest_price: parseFloat(tickets.match(/\d+/)?.[0] || 0),
            source_url: item.url
          });
        } catch (e) {
          // Skip parse errors silently
        }
      }
    } catch (e) { 
      console.error(`❌ Month ${month} failed to load.`); 
    }
    
    // Polite delay so we don't crash their server
    await new Promise(r => setTimeout(r, 2000));
  }

  // 4. Return the raw data back to the Boss (index.js)
  return rawEvents;
}

// ==========================================
// LOCAL TOOLKIT (String manipulation only)
// ==========================================
function adjustTime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  date.setHours(date.getHours() - 2);
  return date.toISOString();
}

function cleanDescription(text) {
  if (!text) return "No description provided.";
  return text.split(/\nDate:| \| Date:/i)[0].trim();
}

function extractVenueAndTickets(fullText) {
  const cleanText = fullText.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ");
  let venue = "Cape Town", tickets = "TBA";
  const vM = cleanText.match(/Venue:\s*(.*?)(?=Tickets:|Price:|Date:|$)/i);
  const tM = cleanText.match(/(?:Tickets|Price):\s*(.*?)(?=Venue:|Date:|Website:|\||$)/i);
  if (vM) venue = vM[1].trim();
  if (tM) tickets = tM[1].trim();
  return { venue, tickets };
}