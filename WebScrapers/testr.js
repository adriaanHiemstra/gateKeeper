import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

// 1. Setup Keys and Client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BOT_HOST_ID = "4c758a6d-e2fd-453c-9e56-713e52cf0629";

/**
 * PRO FIX: Venue Cleaner
 */
function cleanVenueForGoogle(rawVenue) {
  if (!rawVenue || rawVenue.toLowerCase() === "cape town") return "Cape Town";
  // Take first venue before "and", remove anything in brackets
  let cleaned = rawVenue.split(/ and | & /i)[0];
  cleaned = cleaned.replace(/\([^)]*\)/g, "");
  return cleaned.trim();
}

/**
 * ACTUAL GOOGLE GEOCODER
 */
async function geocodeVenue(venueName) {
  const searchName = cleanVenueForGoogle(venueName);
  console.log(
    `🌐 [GEOCODE] Original: "${venueName}" -> Searching: "${searchName}"`,
  );

  if (!GOOGLE_API_KEY || searchName === "Cape Town") {
    return {
      lat: -33.9249,
      lng: 18.4241,
      formatted_address: "Cape Town, South Africa",
    };
  }

  const query = encodeURIComponent(`${searchName}, Cape Town, South Africa`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log(
        `✅ [GOOGLE FOUND]: ${data.results[0].formatted_address} [${location.lat}, ${location.lng}]`,
      );
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: data.results[0].formatted_address,
      };
    } else {
      console.log(
        `❌ Google Maps couldn't find: ${searchName} (Status: ${data.status})`,
      );
    }
  } catch (error) {
    console.log(`⚠️ API Error: ${error.message}`);
  }
  return { lat: -33.9249, lng: 18.4241, formatted_address: venueName };
}

async function runSingleEventTest() {
  console.log(`🚀 Starting Final GPS Test...`);
  const ajaxUrl = "https://eventsincapetown.com/wp-admin/admin-ajax.php";
  const rawPayload = `action=mec_tile_load_month&mec_year=2026&mec_month=04&atts%5Bid%5D=2445&apply_sf_date=0&navigator_click=false`;

  try {
    const response = await axios.post(ajaxUrl, rawPayload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data.month || "");
    const firstTag = $('script[type="application/ld+json"]').first();
    const jsonData = JSON.parse($(firstTag).html());

    if (jsonData["@type"] === "Event") {
      const fullDescription = jsonData.description || "";

      // 🕵️‍♂️ REGEX VENUE HUNTER
      let rawVenueName = "Cape Town";
      const venueMatch = fullDescription.match(/Venue:\s*([^|\n\r]+)/i);
      if (venueMatch) rawVenueName = venueMatch[1].trim();

      // 🛰️ LIVE GEOCODING
      const geoData = await geocodeVenue(rawVenueName);

      const testEvent = {
        host_id: BOT_HOST_ID,
        title: jsonData.name,
        description: fullDescription,
        date: jsonData.startDate,
        end_date: jsonData.endDate || null,
        location_text: rawVenueName,
        lat: geoData.lat,
        lng: geoData.lng,
        banner_url: jsonData.image || null,
        ticket_url: jsonData.offers?.url || jsonData.url,
        category: "GPS-Test-Success",
        is_public: true,
        media_type: "image",
      };

      console.log("\n💾 Saving to Supabase...");
      const { error } = await supabase.from("events").insert([testEvent]);

      if (error) {
        console.error("❌ DB Error:", error.message);
      } else {
        console.log("🎉 SUCCESS! Data is in the DB.");
        console.log(
          `📍 Check your map for Lat: ${testEvent.lat}, Lng: ${testEvent.lng}`,
        );
      }
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  }
}

runSingleEventTest();
