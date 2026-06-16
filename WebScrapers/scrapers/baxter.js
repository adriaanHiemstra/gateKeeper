import axios from "axios";
import * as cheerio from "cheerio";

export default async function scrapeBaxterTheatre(seenUrls) {
  console.log("\n🎭 Running Scraper: Baxter Theatre...");
  const rawEvents = [];
  const localSeenNames = new Set();

  try {
    // 1. Fetch the main homepage / What's On feed
    const listUrl = "https://baxter.uct.ac.za/";
    console.log(`   ⏳ Fetching theatre calendar: ${listUrl}`);

    const listResponse = await axios.get(listUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    const $list = cheerio.load(listResponse.data);
    const eventLinks = [];

    // 2. Find links pointing to individual event pages
    // The Baxter structures their URLs cleanly like /events/show-name
    $list('a[href*="/events/"]').each((i, el) => {
      let link = $list(el).attr('href');

      if (!link) return;
      if (!link.startsWith("http")) link = "https://baxter.uct.ac.za" + link;

      // Clean the list: ensure it's an actual event link and not a generic directory
      if (!eventLinks.includes(link) && link.length > 35) {
        eventLinks.push(link);
      }
    });

    console.log(`   📍 Found ${eventLinks.length} theatrical productions. Investigating...`);

    // 3. Visit each specific show page
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
        // Clean up the title (Remove the site name if it's appended)
        eventName = eventName.replace(/\s*[-|]\s*(Baxter Theatre Centre|University of Cape Town).*/i, '').trim(); 
        
        if (!eventName || localSeenNames.has(eventName)) continue;

        // --- 🎯 HARDCODE THE PERFECT LOCATION ---
        const exactLocation = "Baxter Theatre Centre, Main Rd, Rondebosch, Cape Town, 7700";

        // --- 🎯 EXTRACT DESCRIPTION ---
        let description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content');
                          
        if (!description || description.length < 20) {
            // Grab the main text body from the article section
            description = $('.clearfix, article, main').text().replace(/\s+/g, ' ').trim().substring(0, 300);
            if (description) description += "...";
        }

        // --- 🎯 EXTRACT BANNER IMAGE ---
        let bannerImage = $('meta[property="og:image"]').attr('content') || null;
        if (!bannerImage) {
            // Look for standard image wrappers used in the Baxter CMS
            const firstImg = $('.field--name-field-image img, main img').first().attr('src');
            if (firstImg) {
                bannerImage = firstImg.startsWith('http') ? firstImg : `https://baxter.uct.ac.za${firstImg}`;
            }
        }

        // --- 🎯 EXTRACT DATE ---
        let eventDate = new Date().toISOString();
        let endDate = eventDate;
        const bodyText = $('body').text().replace(/\s+/g, ' ');
        
        // Scan for standard date formats Baxter uses (e.g., "9 April 2026")
        const dateMatch = bodyText.match(/\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+202[4-9]/ig);
        
        if (dateMatch && dateMatch.length > 0) {
            eventDate = new Date(dateMatch[0]).toISOString();
            // If there's a second date mentioned, it's often the end of the theatrical run
            if (dateMatch.length > 1) {
                endDate = new Date(dateMatch[dateMatch.length - 1]).toISOString();
            }
        }

        seenUrls.add(link);
        localSeenNames.add(eventName);

        console.log(`   ✨ Found production: ${eventName}`);

        rawEvents.push({
          title: eventName,
          description: description || `Catch ${eventName} live at the Baxter Theatre!`,
          date: eventDate,
          end_date: endDate, 
          location_text: exactLocation, 
          banner_url: bannerImage,
          ticket_url: link,
          lowest_price: 0, // Fallback, usually requires Webtickets integration to scrape exactly
          source_url: link
        });

      } catch (err) {
        // Silently catch timeouts
      }

      // 🚨 Polite delay
      await new Promise(r => setTimeout(r, 1000));
    }

  } catch (error) {
    console.error("❌ Failed to scrape Baxter Theatre:", error.message);
  }

  return rawEvents;
}