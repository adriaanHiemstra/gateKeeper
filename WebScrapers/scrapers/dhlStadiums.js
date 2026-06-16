import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

export default async function scrapeDhlStadium(seenUrls) {
  console.log("\n🏟️ Running Scraper: DHL Stadium (Headless Browser Mode)...");
  const rawEvents = [];
  const localSeenNames = new Set();

  try {
    // 1. Launch the invisible browser
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Disguise the browser as a regular user
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    const listUrl = "https://dhlstadium.co.za/events";
    console.log(`   ⏳ Fetching stadium calendar and waiting for JavaScript: ${listUrl}`);

    // 2. Load the page and WAIT for the network to stop loading dynamic data
    await page.goto(listUrl, { waitUntil: "networkidle2", timeout: 15000 });

    // Grab the fully rendered HTML after JavaScript has executed
    const content = await page.content();
    const $list = cheerio.load(content);
    const eventLinks = [];

    // 3. Now the links will actually be in the DOM!
    $list('a[href*="/event-detail/"]').each((i, el) => {
      let link = $list(el).attr('href');
      if (!link) return;
      if (!link.startsWith("http")) link = "https://dhlstadium.co.za" + link;
      if (!eventLinks.includes(link)) eventLinks.push(link);
    });

    console.log(`   📍 Found ${eventLinks.length} stadium events. Investigating...`);

    // 4. Visit each specific event page
    for (const link of eventLinks) {
      if (seenUrls.has(link)) continue;

      try {
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: 10000 });
        const eventContent = await page.content();
        const $ = cheerio.load(eventContent);

        // --- 🎯 EXTRACT TITLE ---
        let eventName = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim();
        eventName = eventName.replace(/\s*[-|]\s*DHL Stadium/i, '').trim(); 
        
        if (!eventName || localSeenNames.has(eventName)) continue;

        // --- 🎯 HARDCODE THE PERFECT LOCATION ---
        const exactLocation = "DHL Stadium, Fritz Sonnenberg Rd, Green Point, Cape Town, 8051";

        // --- 🎯 EXTRACT DESCRIPTION ---
        let description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content');
                          
        if (!description || description.length < 20) {
            description = $('p').first().text().trim().substring(0, 300);
            if (description) description += "...";
        }

        // --- 🎯 EXTRACT BANNER IMAGE ---
        let bannerImage = $('meta[property="og:image"]').attr('content') || null;
        if (!bannerImage) {
            const firstImg = $('main img, .banner img').first().attr('src');
            if (firstImg) {
                bannerImage = firstImg.startsWith('http') ? firstImg : `https://dhlstadium.co.za${firstImg}`;
            }
        }

        // --- 🎯 EXTRACT DATE ---
        let eventDate = new Date().toISOString();
        const bodyText = $('body').text();
        const dateMatch = bodyText.match(/\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+202[4-9]/i);
        
        if (dateMatch) {
            eventDate = new Date(dateMatch[0]).toISOString();
        }

        seenUrls.add(link);
        localSeenNames.add(eventName);

        console.log(`   ✨ Found event: ${eventName}`);

        rawEvents.push({
          title: eventName,
          description: description || `Experience ${eventName} live at the DHL Stadium!`,
          date: eventDate,
          end_date: eventDate, 
          location_text: exactLocation,
          banner_url: bannerImage,
          ticket_url: link,
          lowest_price: 0, 
          source_url: link
        });

      } catch (err) {
        // Silently catch timeouts for individual pages
      }
    }

    // ALWAYS close the browser when done to prevent memory leaks!
    await browser.close();

  } catch (error) {
    console.error("❌ Failed to scrape DHL Stadium:", error.message);
  }

  return rawEvents;
}