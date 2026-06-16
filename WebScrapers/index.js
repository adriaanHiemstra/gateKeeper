import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
// We will move your helper functions into a utils.js file next
import { getLiveCategories, getAIAnalysis, geocodeVenue } from './utils.js'; 

// 1. IMPORT YOUR WORKERS
import scrapeEventsInCapeTown from './scrapers/eventsInCapeTown.js';
import scrapeRunningCalendar from "./scrapers/runningCalendar.js";
import scrapeBandsInTown from "./scrapers/bandsInTown.js";
import scrapeBattistrada from "./scrapers/battistrada.js";
import scrapeCapeMarkets from "./scrapers/capeMarkets.js";
import scrapeDhlStadiums from "./scrapers/dhlStadiums.js";
import scrapeBaxter from "./scrapers/baxter.js";
import scrapeCTICC from "./scrapers/cticc.js";
import scrapePsymedia from './scrapers/psymedia.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_HOST_ID = "4c758a6d-e2fd-453c-9e56-713e52cf0629";

// 2. REGISTER YOUR WORKERS IN AN ARRAY
const activeScrapers = [
  scrapeEventsInCapeTown,
  scrapeRunningCalendar,
  scrapeBandsInTown,
  scrapeBattistrada,
  scrapeCapeMarkets,
  scrapeDhlStadiums,
  scrapeBaxter,
  scrapeCTICC,
  scrapePsymedia,
];

async function runAllScrapers() {
  console.log("🚀 Starting GateKeeper Master Engine...");
  
  // Get live tags and existing URLs once for all scrapers
  const validTags = await getLiveCategories(supabase);
  const { data: existing } = await supabase.from('events').select('source_url');
  const seenUrls = new Set(existing?.map(e => e.source_url) || []);

  // 3. LOOP THROUGH EACH WEBSITE
  for (const scraperFunction of activeScrapers) {
    try {
      // The worker returns raw data
      const rawEvents = await scraperFunction(seenUrls); 
      
      if (!rawEvents || rawEvents.length === 0) continue;

      const finalizedEvents = [];

      // 4. THE BOSS PROCESSES THE DATA (AI & Geocoding)
      for (const event of rawEvents) {
        console.log(`   🧠 Analyzing with AI: ${event.title}`);
        
        const aiTags = await getAIAnalysis(event.title, event.description, validTags);
        const geo = await geocodeVenue(event.location_text);

        finalizedEvents.push({
          ...event,              // Keep the raw data (title, url, date)
          host_id: BOT_HOST_ID,
          lat: geo.lat, 
          lng: geo.lng,
          categories: aiTags,    // Add our synced AI tags
          is_public: true,
          media_type: "image"
        });
      }

      // 5. SAVE TO DATABASE
      if (finalizedEvents.length > 0) {
        const { error } = await supabase.from('events').insert(finalizedEvents);
        if (error) console.error(`❌ DB Error for ${scraperFunction.name}:`, error.message);
        else console.log(`✅ Saved ${finalizedEvents.length} events from ${scraperFunction.name}`);
      }

    } catch (error) {
      console.error(`❌ Scraper failed: ${error.message}`);
    }
  }
  
  console.log("🏁 All scrapers finished!");
}

runAllScrapers();