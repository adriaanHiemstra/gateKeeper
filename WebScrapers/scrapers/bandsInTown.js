import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import axios from "axios";
//import extractPreciseLocation from "../utils/locationSniper.js";

export default async function scrapeBandsInTown(seenUrls) {
  console.log("\n🎸 Running Scraper: BandsInTown (Cape Town)...");
  const rawEvents = [];
  const localSeenNames = new Set();
  
  console.log("   ⏳ Booting up invisible browser (this takes a few seconds)...");
  
  let browser;
  try {
    // 1. Launch a real, headless Chrome browser
    browser = await puppeteer.launch({ 
      headless: "new", // Run silently in the background
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();

    // 2. Disguise the browser as a normal human on Windows
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1366, height: 768 });

    const searchUrl = "https://www.bandsintown.com/c/cape-town-south-africa";
    console.log(`   ⏳ Loading ${searchUrl}...`);

    // 3. Go to the page and wait until all network requests go quiet (meaning React is done)
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });

    console.log("   📜 Scrolling down to trigger lazy-loaded events...");
    // 4. Simulate a human scrolling down the page to load more events
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 600;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          // Stop scrolling after a few pages or if we hit the bottom
          if (totalHeight >= scrollHeight || totalHeight > 6000) {
            clearInterval(timer);
            resolve();
          }
        }, 600); // Scroll every 600ms
      });
    });

    // 5. Grab the fully rendered HTML!
    const html = await page.content();
    const $ = cheerio.load(html);

    //const locationName = extractPreciseLocation($, "Cape Town");


    // 6. BandsInTown usually injects hidden SEO data (JSON-LD) for Google. Let's steal it.
    const scripts = $('script[type="application/ld+json"]').toArray();
    
    for (const tag of scripts) {
      try {
        const jsonData = JSON.parse($(tag).html());
        
        // Sometimes the JSON is an array of events, sometimes just one
        const items = Array.isArray(jsonData) ? jsonData : [jsonData];

        for (const item of items) {
          // If it's not an event, or if it's missing a name, skip
          if (item["@type"] !== "MusicEvent" && item["@type"] !== "Event") continue;
          
          const eventName = item.name ? item.name.trim() : "Unknown Gig";
          const eventUrl = item.url;
          
          // Deduplication checks
          if (!eventUrl) continue;
          if (seenUrls.has(eventUrl) || localSeenNames.has(eventName)) continue;

          seenUrls.add(eventUrl);
          localSeenNames.add(eventName);

          console.log(`   ✨ Found live music: ${eventName}`);

  let locationName = "Cape Town" ;
          if (item.location?.name) locationName = item.location.name;
          // --- 🎯 FETCH RICH DESCRIPTIONS ---
          let finalDescription = item.description || "";
          
          // If the description is missing, or is just the artist's name, let's go fetch the real one!
          if (!finalDescription || finalDescription.length <= eventName.length + 5) {
              try {
                  // We use a quick, lightweight axios ping to the individual event page
                  const eventPageRes = await axios.get(eventUrl, {
                      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
                      timeout: 5000
                  });
                  const $event = cheerio.load(eventPageRes.data);
                  
                  // Grab the rich SEO description used for Google search previews
                  const metaDesc = $event('meta[property="og:description"]').attr('content') || 
                                   $event('meta[name="description"]').attr('content');
                                   
                  if (metaDesc) {
                      finalDescription = metaDesc;
                  } else {
                      // Ultimate Fallback: Construct a nice sentence
                      finalDescription = `Catch ${eventName} performing live at ${locationName}! Get your tickets and see the full lineup.`;
                  }
              } catch (e) {
                  // If the ping fails, fallback smoothly
                  finalDescription = `Catch ${eventName} performing live at ${locationName}!`;
              }
          }

          rawEvents.push({
            title: eventName,
            description: finalDescription, // 🚨 Updated to use our new rich description
            date: item.startDate || new Date().toISOString(),
            end_date: item.endDate || item.startDate || new Date().toISOString(),
            location_text: locationName,
            banner_url: item.image || null,
            ticket_url: eventUrl,
            lowest_price: 0, 
            source_url: eventUrl
          });
        }
      } catch (e) {
        // Skip bad JSON silently
      }
    }

  } catch (error) {
    console.error("❌ Failed to scrape BandsInTown:", error.message);
  } finally {
    // 🚨 CRITICAL: Always close the browser, otherwise it will eat up your computer's RAM!
    if (browser) await browser.close();
  }

  return rawEvents;
}