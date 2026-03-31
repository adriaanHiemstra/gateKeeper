// ==========================================
// 1. SETUP (Imports and API Keys)
// ==========================================
import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai"; // <--- ADD THIS

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // <--- ADD THIS
const BOT_HOST_ID = "4c758a6d-e2fd-453c-9e56-713e52cf0629";
// ==========================================
// TOOLKIT FOR SECTION 4 (Data Formatting Helpers)
// ==========================================

// Adjusts timezone down by 2 hours
function adjustTime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  date.setHours(date.getHours() - 2);
  return date.toISOString();
}

// Chops off the description at "Date:"
function cleanDescription(text) {
  if (!text) return "No description provided.";
  let cleaned = text.split(/Date:/i)[0];
  return cleaned.trim();
}

// Separates the Venue name from the Ticket prices and strips hidden HTML
function extractVenueAndTickets(fullText) {
  const cleanText = fullText.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ");
  let venue = "Cape Town";
  let tickets = "TBA";

  const venueMatch = cleanText.match(
    /Venue:\s*(.*?)(?=Tickets:|Price:|Date:|$)/i,
  );
  if (venueMatch && venueMatch[1]) venue = venueMatch[1].trim();

  const ticketMatch = cleanText.match(
    /(?:Tickets|Price):\s*(.*?)(?=Venue:|Date:|Website:|\||$)/i,
  );
  if (ticketMatch && ticketMatch[1]) tickets = ticketMatch[1].trim();

  venue = venue.replace(/[-|]$/, "").trim();
  tickets = tickets.replace(/[-|]$/, "").trim();

  return { venue, tickets };
}

// Extracts just the number (e.g., turns "From R150" into 150)
function extractNumericPrice(priceString) {
  if (!priceString || priceString.toLowerCase().includes("free")) return 0;
  const match = priceString.match(/\d+/);
  return match ? parseFloat(match[0]) : null;
}

// Cleans the venue string so Google Maps can read it easily
function cleanVenueForGoogle(rawVenue) {
  if (!rawVenue || rawVenue.toLowerCase() === "cape town") return "Cape Town";
  let cleaned = rawVenue.split(/ and | & |,/i)[0];
  cleaned = cleaned.replace(/\([^)]*\)/g, "");
  return cleaned.trim();
}

// Calls Google Maps API to get Latitude and Longitude
async function geocodeVenue(venueName) {
  const searchName = cleanVenueForGoogle(venueName);
  if (!GOOGLE_API_KEY || searchName === "Cape Town")
    return { lat: -33.9249, lng: 18.4241 };

  const query = encodeURIComponent(`${searchName}, Cape Town, South Africa`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_API_KEY}`;

  try {
    const res = await axios.get(url);
    if (res.data.status === "OK" && res.data.results.length > 0) {
      return res.data.results[0].geometry.location;
    }
  } catch (e) {
    console.log("   ⚠️ Geocode error");
  }
  return { lat: -33.9249, lng: 18.4241 };
}

// Visits the event page to hunt for the actual Quicket/Howler link
async function getActualBookingLink(eventPageUrl) {
  if (!eventPageUrl) return null;
  try {
    const res = await axios.get(eventPageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(res.data);
    let foundLink = null;

    $("a").each((i, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (
        text.includes("book here") ||
        text.includes("buy ticket") ||
        text.includes("book online")
      ) {
        foundLink = $(el).attr("href");
      }
    });

    if (!foundLink) foundLink = $(".mec-booking-button").attr("href");
    return foundLink || eventPageUrl;
  } catch (err) {
    return eventPageUrl;
  }
}

// ==========================================
// 2. THE AI TAGGER (OpenAI)
// ==========================================

const ALLOWED_TAGS = [
  "Acoustic",
  "Activities",
  "Afrobeats",
  "Amapiano",
  "Art",
  "Beach",
  "Cinema",
  "Comedy",
  "Crafts",
  "Cricket",
  "Date Night",
  "DnB",
  "Electronic",
  "Festivals",
  "Food Market",
  "Gaming",
  "Hikes",
  "Hiking",
  "Hip Hop",
  "House",
  "Jazz",
  "Live Music",
  "Magic",
  "Markets",
  "Music",
  "Nightlife",
  "Outdoors",
  "Psytrance",
  "Quiz",
  "Rock",
  "Rugby",
  "Running",
  "Shows",
  "Soccer",
  "Sports",
  "Surfing",
  "Techno",
  "Tennis",
  "Theatre",
  "Thrift",
  "Workshops",
  "Yoga",
];

async function getEventTags(description) {
  // Safe default for empty descriptions
  if (!description || description.length < 20) return ["Events", "Cape Town"];

  // Cut the description down to save tokens/money (1000 chars is plenty for the AI to get the vibe)
  const shortDesc = description.substring(0, 1000);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // The fastest and cheapest model
      response_format: { type: "json_object" }, // 🔥 Forces perfect JSON output
      messages: [
        {
          role: "system",
          content: `You are an expert event categorizer for a Cape Town app. Read the event description and assign EXACTLY 4 tags that best describe it. 
          
          CRITICAL RULES:
          1. You MUST ONLY choose tags from the Allowed Tags list below. Do not make up your own tags.
          2. Return your answer as a JSON object with a single key called "tags" containing an array of your 4 string choices.
          
          Allowed Tags: ${ALLOWED_TAGS.join(", ")}`,
        },
        {
          role: "user",
          content: `Event Description: ${shortDesc}`,
        },
      ],
    });

    // Parse the JSON string OpenAI gives us back
    const jsonResult = JSON.parse(response.choices[0].message.content);

    // Ensure we actually got an array back, otherwise fallback
    if (jsonResult.tags && Array.isArray(jsonResult.tags)) {
      return jsonResult.tags;
    }
  } catch (error) {
    console.log(`   ⚠️ AI Error: ${error.message}`);
  }

  // Fallback if the AI fails
  return ["Events", "Cape Town"];
}
// ==========================================
// THE MAIN ENGINE
// ==========================================
async function scrapeEntireYear(year) {
  console.log(`🚀 Starting Core Scraper for ${year}...`);
  const months = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];
  const allEvents = [];
  const seenTitles = new Set();

  // ==========================================
  // 2. STEPPING THROUGH THE WEBSITE TO THE CORRECT PAGE
  // ==========================================
  for (const month of months) {
    console.log(`\n📅 Fetching events for ${month}/${year}...`);
    // This payload acts like a user clicking "Next Month" on the calendar
    const rawPayload = `action=mec_tile_load_month&mec_year=${year}&mec_month=${month}&atts%5Bid%5D=2445&apply_sf_date=0&navigator_click=false`;

    try {
      const response = await axios.post(
        "https://eventsincapetown.com/wp-admin/admin-ajax.php",
        rawPayload,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": "Mozilla/5.0",
          },
        },
      );

      // ==========================================
      // 3. STEPPING THROUGH THE PAGE TO FIND THE RIGHT PARTS
      // ==========================================
      // Load the HTML response into Cheerio (our virtual browser)
      const $ = cheerio.load(response.data.month || "");

      // Find all the hidden JSON blocks that WordPress uses for SEO
      const scriptTags = $('script[type="application/ld+json"]').toArray();

      for (const tag of scriptTags) {
        const jsonData = JSON.parse($(tag).html());

        // Check if the block is actually an "Event" and we haven't seen it yet
        if (jsonData["@type"] === "Event" && !seenTitles.has(jsonData.name)) {
          seenTitles.add(jsonData.name);

          // ==========================================
          // 4. GRABBING THE INFO & FORMATTING IT
          // ==========================================

          // Use our toolkit to clean up the messy strings
          const { venue, tickets } = extractVenueAndTickets(
            jsonData.description || "",
          );
          const numericPrice = extractNumericPrice(tickets);
          const cleanDesc = cleanDescription(jsonData.description);

          // Trigger our external API calls (Google Maps & Link Hunting)
          const geoData = await geocodeVenue(venue);
          const sourceUrl = jsonData.offers?.url || jsonData.url;
          console.log(`   🔗 Hunting for ticket link: ${jsonData.name}...`);
          const actualTicketUrl = await getActualBookingLink(sourceUrl);

          // 🧠 Ask OpenAI to tag the event
          console.log(`   🧠 Asking AI to tag: ${jsonData.name}...`);
          const generatedTags = await getEventTags(cleanDesc);
          console.log(`   🏷️  AI Tags: [${generatedTags.join(", ")}]`);

          // Construct the final, perfectly formatted object
          allEvents.push({
            host_id: BOT_HOST_ID,
            title: jsonData.name,
            description: cleanDesc,
            date: adjustTime(jsonData.startDate),
            end_date: adjustTime(jsonData.endDate),
            location_text: venue,
            lat: geoData.lat,
            lng: geoData.lng,
            banner_url: jsonData.image || null,
            ticket_url: actualTicketUrl,
            lowest_price: numericPrice,
            ticket_tiers: [{ name: "General", price: tickets }],
            tags: generatedTags,
            category: "Scraped",
            is_public: true,
            media_type: "image",
          });
        }
      }
    } catch (e) {
      console.error(`❌ Error in ${month}: ${e.message}`);
    }

    // Wait 1.5 seconds before hitting the website for the next month to avoid a ban
    await new Promise((r) => setTimeout(r, 1500));
  }

  // ==========================================
  // 5. PUSHING THE DATA TO THE DATABASE
  // ==========================================
  if (allEvents.length > 0) {
    console.log(
      `\n💾 Saving ${allEvents.length} beautifully cleaned events to Supabase...`,
    );

    // Push the entire array of objects to Supabase in one single transaction
    const { error } = await supabase.from("events").insert(allEvents);

    if (error) {
      console.error("❌ Database Error:", error.message);
    } else {
      console.log("🎉 SUCCESS! Data is live in the database.");
    }
  } else {
    console.log("🤔 No new events found.");
  }
}

// Start the scrape!
scrapeEntireYear("2026");
