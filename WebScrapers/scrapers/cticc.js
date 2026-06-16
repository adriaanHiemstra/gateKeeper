import axios from "axios";
import * as cheerio from "cheerio";

export default async function scrapeCticc(seenUrls) {
  console.log("\n🏢 Running Scraper: CTICC...");
  const rawEvents = [];
  const localSeenNames = new Set();

  try {
    // 1. Fetch the main "What's On" calendar list
    const listUrl = "https://www.cticc.co.za/visitor/whats-on/";
    console.log(`   ⏳ Fetching convention calendar: ${listUrl}`);

    const listResponse = await axios.get(listUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    const $list = cheerio.load(listResponse.data);
    const eventLinks = [];

    // 2. Find links pointing to individual event pages
    // CTICC uses a Custom Post Type slug called /whats_on_events/
    $list('a[href*="/whats_on_events/"]').each((i, el) => {
      let link = $list(el).attr('href');

      if (!link) return;
      if (!link.startsWith("http")) link = "https://www.cticc.co.za" + link;

      // Ensure we don't grab generic category pages
      if (!eventLinks.includes(link) && link.length > 40) {
        eventLinks.push(link);
      }
    });

    console.log(`   📍 Found ${eventLinks.length} upcoming conventions & expos. Investigating...`);

    // 3. Visit each specific event page
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
        eventName = eventName.replace(/\s*[-|]\s*CTICC.*/i, '').trim(); 
        
        if (!eventName || localSeenNames.has(eventName)) continue;

        // --- 🎯 HARDCODE THE PERFECT LOCATION ---
        const exactLocation = "Cape Town International Convention Centre (CTICC), Convention Square, 1 Lower Long Street, Cape Town, 8001";

        // --- 🎯 EXTRACT DESCRIPTION ---
        let description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content');
                          
        if (!description || description.length < 20) {
            // Grab the main text body from the content area
            description = $('.entry-content, main').text().replace(/\s+/g, ' ').trim().substring(0, 300);
            if (description) description += "...";
        }

        // --- 🎯 EXTRACT BANNER IMAGE ---
        let bannerImage = $('meta[property="og:image"]').attr('content') || null;
        if (!bannerImage) {
            const firstImg = $('.entry-content img, main img').first().attr('src');
            if (firstImg) {
                bannerImage = firstImg.startsWith('http') ? firstImg : `https://www.cticc.co.za${firstImg}`;
            }
        }

        // --- 🎯 EXTRACT DATE ---
        let eventDate = new Date().toISOString();
        let endDate = eventDate;
        const bodyText = $('body').text().replace(/\s+/g, ' ');
        
        // Scan for standard date formats (e.g., "30 Apr - 3 May 2026" or "13 - 15 Apr 2026")
        const dateMatch = bodyText.match(/\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+202[4-9]/ig);
        
        if (dateMatch && dateMatch.length > 0) {
            eventDate = new Date(dateMatch[0]).toISOString();
            if (dateMatch.length > 1) {
                endDate = new Date(dateMatch[dateMatch.length - 1]).toISOString();
            }
        }

        seenUrls.add(link);
        localSeenNames.add(eventName);

        console.log(`   ✨ Found expo: ${eventName}`);

        rawEvents.push({
          title: eventName,
          description: description || `Join us for ${eventName} at the CTICC!`,
          date: eventDate,
          end_date: endDate, 
          location_text: exactLocation, 
          banner_url: bannerImage,
          ticket_url: link,
          lowest_price: 0, 
          source_url: link
        });

      } catch (err) {
        // Silently catch timeouts to keep the engine running
      }

      // 🚨 Polite delay
      await new Promise(r => setTimeout(r, 1000));
    }

  } catch (error) {
    console.error("❌ Failed to scrape CTICC:", error.message);
  }

  return rawEvents;
}