import axios from "axios";
import OpenAI from "openai";

// ==========================================
// SETUP API CLIENTS
// ==========================================
// Note: We don't need 'dotenv/config' here because index.js already loaded it!
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ==========================================
// 1. DATABASE SYNC (The "Validation Layer")
// ==========================================
export async function getLiveCategories(supabase) {
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

// ==========================================
// 2. AI TAGGING ENGINE
// ==========================================
export async function getAIAnalysis(title, description, validTags) {
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
    
    // Ensure it's an array and respect the DB constraint of max 5 tags
    return Array.isArray(res.categories) ? res.categories.slice(0, 5) : ["Activities"];
  } catch (e) {
    return ["Activities"];
  }
}

// ==========================================
// 3. GOOGLE MAPS GEOCODER
// ==========================================
// Helper to strip out bracketed info or "and" for better Google Maps accuracy
function cleanVenueForGoogle(rawVenue) {
  if (!rawVenue || rawVenue.toLowerCase() === "cape town") return "Cape Town";
  let cleaned = rawVenue.split(/ and | & /i)[0];
  cleaned = cleaned.replace(/\([^)]*\)/g, ""); // Removes anything in brackets
  return cleaned.trim();
}

export async function geocodeVenue(venueName) {
  const searchName = cleanVenueForGoogle(venueName);
  
  if (!GOOGLE_API_KEY || searchName === "Cape Town") {
    // Fallback coordinates for general Cape Town
    return { lat: -33.9249, lng: 18.4241 };
  }
  
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchName + ", Cape Town")}&key=${GOOGLE_API_KEY}`;
  
  try {
    const res = await axios.get(url, { timeout: 5000 });
    return res.data.results[0]?.geometry.location || { lat: -33.9249, lng: 18.4241 };
  } catch (e) { 
    return { lat: -33.9249, lng: 18.4241 }; 
  }
}