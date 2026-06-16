import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

export default async function scrapePsymedia(seenUrls) {
  console.log("\n🪩 Running Scraper: Psymedia (Headless Browser Mode)...");
  const rawEvents = [];
  const localSeenNames = new Set();

  try {
    // 1. Launch Puppeteer to act like a real human browser
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Disguise the browser
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    const listUrl = "https://psymedia.co.za/event_city/cape-town/";
    console.log(`   ⏳ Fetching festival calendar and bypassing bot-protection: ${listUrl}`);

    // Wait until the network is completely quiet (meaning all JS/Cloudflare checks are done)
    await page.goto(listUrl, { waitUntil: "networkidle2", timeout: 20000 });

    const content = await page.content();
    const $list = cheerio.load(content);
    const eventLinks = [];

    // 2. A SMARTER LINK CATCHER
    // Instead of strictly looking for "/event/", we look at all links inside their standard event grid/list containers
    $list('a').each((i, el) => {
      let link = $list(el).attr('href');
      if (!link) return;
      
      // Ensure absolute URL
      if (!link.startsWith("http")) link = "https://psymedia.co.za" + link;

      // Catch standard event slugs, or links pointing to ticketing sites (Quicket/Howler)
      const isEventSlug = link.includes('/event/') || link.includes('/events/') || link.includes('/party/');
      const isTicketingLink = link.includes('quicket.co.za') || link.includes('howler.co.za');
      
      // Filter out junk links (categories, tags, authors, contact pages)
      const isJunk = link.includes('/category/') || link.includes('/tag/') || link.includes('/author/');

      if ((isEventSlug || isTicketingLink) && !isJunk && !eventLinks.includes(link)) {
        eventLinks.push(link);
      }
    });

    console.log(`   📍 Found ${eventLinks.length} potential events. Investigating...`);

    // 3. Visit each link (If it's an internal Psymedia page)
    for (const link of eventLinks) {
      if (seenUrls.has(link) || link.includes('quicket') || link.includes('howler')) {
          // If it's a direct Quicket/Howler link, we'll skip it here as your other scrapers handle those!
          continue; 
      }

      try {
// Load the page and WAIT for the network to stop loading dynamic data
        await page.goto(listUrl, { waitUntil: "networkidle2", timeout: 20000 });

        // 🚨 X-RAY VISION: Take a literal screenshot of what the browser sees!
        await page.screenshot({ path: 'psymedia-debug.png', fullPage: true });
        console.log("   📸 SAVED SCREENSHOT! Open psymedia-debug.png in your folder to see what happened.");        const eventContent = await page.content();
        const $ = cheerio.load(eventContent);

        // --- 🎯 EXTRACT TITLE ---
        let eventName = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim();
        eventName = eventName.replace(/\s*[-|]\s*Psymedia.*/i, '').trim(); 
        
        if (!eventName || localSeenNames.has(eventName)) continue;

        // --- 🎯 EXTRACT DESCRIPTION ---
        let description = $('meta[property="og:description"]').attr('content');
        if (!description || description.length < 20) {
            description = $('.entry-content, .event-description, main').text().replace(/\s+/g, ' ').trim().substring(0, 300);
            if (description) description += "...";
        }

        // --- 🎯 EXTRACT BANNER IMAGE ---
        let bannerImage = $('meta[property="og:image"]').attr('content');
        if (!bannerImage) {
            const firstImg = $('.event-image img, .entry-content img').first().attr('src');
            if (firstImg) bannerImage = firstImg.startsWith('http') ? firstImg : `https://psymedia.co.za${firstImg}`;
        }

        // --- 🎯 DEFAULT FALLBACKS ---
        let exactLocation = "Cape Town (Check event link for exact venue)";
        let eventDate = new Date().toISOString();
        let endDate = eventDate;
        let ticketUrl = link;

        // --- 🎯 THE MAGIC JSON-LD EXTRACTOR ---
        const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
        for (const script of jsonLdScripts) {
          try {
            const data = JSON.parse($(script).html());
            const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
            
            for (const item of items) {
              if (item['@type'] === 'Event' || item['@type'] === 'MusicEvent') {
                if (item.location?.name) {
                    exactLocation = item.location.name;
                    if (item.location.address?.streetAddress) exactLocation += `, ${item.location.address.streetAddress}`;
                }
                if (item.startDate) eventDate = new Date(item.startDate).toISOString();
                if (item.endDate) endDate = new Date(item.endDate).toISOString();
                if (item.offers?.url) ticketUrl = item.offers.url;
              }
            }
          } catch (e) {}
        }

        seenUrls.add(link);
        localSeenNames.add(eventName);

        console.log(`   ✨ Found event: ${eventName} @ ${exactLocation.split(',')[0]}`);

        rawEvents.push({
          title: eventName,
          description: description || `Experience ${eventName} with Psymedia!`,
          date: eventDate,
          end_date: endDate, 
          location_text: exactLocation, 
          banner_url: bannerImage,
          ticket_url: ticketUrl,
          lowest_price: 0, 
          source_url: link
        });

      } catch (err) {
         // Catch timeouts gracefully
      }
    }

    await browser.close();

  } catch (error) {
    console.error("❌ Failed to scrape Psymedia:", error.message);
  }

  return rawEvents;
}