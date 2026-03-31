import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ==========================================
// 1. SETUP & ENV
// ==========================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BOT_HOST_ID = "4c758a6d-e2fd-453c-9e56-713e52cf0629";

// ==========================================
// 2. SYNC HELPERS (The "Validation Layer")
// ==========================================

/**
 * Fetches the current list of category names directly from your DB
 */
async function getLiveCategories() {
  console.log("📡 Syncing with database categories...");
  try {
    const { data, error } = await supabase.from('categories').select('name');
    if (error) throw error;
    const names = data.map(c => c.name);
    console.log(`✅ Synced ${names.length} valid categories.`);
    return names;
  } catch (err) {
    console.error("⚠️ Could not sync categories. Using emergency fallback list.");
    return ["Music", "Nightlife", "Activities", "Food Market", "Shows"];
  }
}

/**
 * AI Analysis with Dynamic Tag List
 */
async function getAIAnalysis(title, description, validTags) {
  if (!description || description.length < 10) return ["Activities"];
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an event analyst for GateKeeper. 
          Assign 3-5 tags from this list ONLY: ${validTags.join(", ")}.
          Rank them from MOST relevant to LEAST relevant.
          Return JSON: {"categories": ["Tag1", "Tag2", "Tag3"]}`
        },
        { role: "user", content: `Event: ${title}\nDescription: ${description.substring(0, 800)}` }
      ],
    });
    const res = JSON.parse(response.choices[0].message.content);
    return Array.isArray(res.categories) ? res.categories.slice(0, 5) : ["Activities"];
  } catch (e) {
    return ["Activities"];
  }
}

// ==========================================
// 3. TOOLKIT (Data Formatting)
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

async function geocodeVenue(venueName) {
  if (!GOOGLE_API_KEY || !venueName || venueName.toLowerCase() === "cape town") {
    return { lat: -33.9249, lng: 18.4241 };
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(venueName + ", Cape Town")}&key=${GOOGLE_API_KEY}`;
  try {
    const res = await axios.get(url, { timeout: 5000 });
    return res.data.results[0]?.geometry.location || { lat: -33.9249, lng: 18.4241 };
  } catch (e) { return { lat: -33.9249, lng: 18.4241 }; }
}

// ==========================================
// 4. MAIN ENGINE
// ==========================================
async function runScraper(year) {
  const validTags = await getLiveCategories();
  
  // Fetch existing URLs to avoid duplicates
  const { data: existing } = await supabase.from('events').select('source_url');
  const seenUrls = new Set(existing?.map(e => e.source_url) || []);

  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

  for (const month of months) {
    console.log(`\n📅 --- Processing ${month}/${year} ---`);
    const monthlyEvents = [];

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
          if (item["@type"] !== "Event" || seenUrls.has(item.url)) continue;

          console.log(`   ✨ Processing: ${item.name}`);
          const { venue, tickets } = extractVenueAndTickets(item.description || "");
          const geo = await geocodeVenue(venue);
          const desc = cleanDescription(item.description);
          const aiTags = await getAIAnalysis(item.name, desc, validTags);

          monthlyEvents.push({
            host_id: BOT_HOST_ID,
            title: item.name,
            description: desc,
            date: adjustTime(item.startDate),
            end_date: adjustTime(item.endDate),
            location_text: venue,
            lat: geo.lat, lng: geo.lng,
            banner_url: item.image || null,
            ticket_url: item.url,
            lowest_price: parseFloat(tickets.match(/\d+/)?.[0] || 0),
            categories: aiTags, // SYNCED ARRAY
            source_url: item.url,
            is_public: true,
            media_type: "image"
          });
        } catch (e) { console.error("   ⚠️ Skip: Parse error"); }
      }

      if (monthlyEvents.length > 0) {
        const { error } = await supabase.from('events').insert(monthlyEvents);
        if (!error) console.log(`   ✅ Saved ${monthlyEvents.length} events.`);
      }
    } catch (e) { console.error(`❌ Month ${month} failed.`); }
    
    await new Promise(r => setTimeout(r, 2000));
  }
}

runScraper("2026");
//scrapeEntireYear("2026");