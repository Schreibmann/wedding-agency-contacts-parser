const fs = require('fs');
const puppeteer = require('puppeteer');

const result = [];

const main = async () => {
    const browser = await puppeteer.launch({ headless: true });

    const initPage = async (url) => {
        const pages = await browser.pages();
        const page = pages[0]; //await browser.newPage();
        await page.goto(url);
        return page;
    }

    const processPage = async (page) => {
        await page.waitForSelector('.app-listing-content');
        
        const cards = await page.$$('.app-ec-item');

        for (let i = 0; i < cards.length; i++) {
            console.log('iteration ', i)
            console.log('result ', result)
            await cards[i].click();
            await page.waitForTimeout(1000);
    
            const pages = await browser.pages();
            const agencyPage = pages[pages.length - 1];
            
            await processAgency(agencyPage)
        }

        const nextButton = await page.$('span.pagination__next > button');

        if (nextButton) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            await processPage(page);
        } else {
            const JSONdata = JSON.stringify(result);
            fs.writeFileSync('agencies.json', JSONdata);
            await browser.close();
        }

    }

    const processAgency = async (page) => {
        const agencyObj = { name: null, phone: null, site: null, email: null };
        
        await page.waitForSelector('h1.storefrontHeading__title');

        const titleElement = await page.$('h1.storefrontHeading__title');
    
        if (titleElement) {
            const titleValue = await titleElement.evaluate(el => el.textContent, titleElement)
            agencyObj.name = titleValue;
        }
        
        const phoneButton = await page.$('button.storefrontHeading__phone'); 
        const linkButton = await page.$('span.app-storefront-visit-website');
    
        if (phoneButton) {
            await phoneButton.click();
            await page.waitForSelector('a.leadModalPhoneBox__phoneNumber');
            const phoneElement = await page.$('a.leadModalPhoneBox__phoneNumber')
            const phoneValue = await phoneElement.evaluate(el => el.textContent, phoneElement)
            agencyObj.phone = phoneValue;
        }
    
        if (linkButton) {
            const linkValue = await linkButton.evaluate(el => el.getAttribute("data-href"), linkButton)
            agencyObj.site = linkValue;
        }
    
        result.push(agencyObj)
        await page.waitForTimeout(1000);
        await page.close();
    }

   
    
    const hitchedPage = await initPage("https://www.hitched.co.uk/wedding-planner/");
    
    await processPage(hitchedPage);
}

main();