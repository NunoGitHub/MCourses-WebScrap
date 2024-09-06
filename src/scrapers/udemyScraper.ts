import puppeteer from "puppeteer-extra";
import { Course } from "../types/course";
import { logAsync, logger, loggerTXT } from "../utils/logger";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {  CaptchaType } from "../enums/captchaType";
import { Udemy } from "../types/udemy";
import { Page } from "puppeteer";
import { Category } from "../types/category";
import * as fs from 'fs';
import { TypeCourse } from "../enums/typeCourse";

import * as homepageModule from  "../models/homepage"

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// scrapping udemy
export async function scrapeUdemyCoursesFrontPage(): Promise<Course[]> {

 // logger.info(`Starting scraping for Udemy with the term: ${searchTerm}`);
  let scrapedData: Course[] = [];
  let captchaType_ :CaptchaType = CaptchaType.None;
  let udemy : Udemy ={
    responseStatus:0,
    responseUrl:"",
    typeCaptcha: CaptchaType.None,
  };

  let isCaptchaFailed: boolean = true;

  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--ignore-certificate-errors",
      "--window-size=1080,1900",
    ],
  });

  const page = await browser.newPage();
  const courses: Course[] = [];
 
  while (scrapedData?.length <= 1 || scrapedData == null) {
    try {
      //Set HTTP headers to simulate a real browser
      await page.setExtraHTTPHeaders({
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      });

      const baseUrl = "https://www.udemy.com";

      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle2" });

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Simulate human interactions to avoid bot detection
      //Function to wait for a certain time (in milliseconds)
     
      await delay(Math.random() * 2000 + 1000); //  Random wait between 1s and 3s // Random wait between 1s and 3s

      await page.setCacheEnabled(true);

      //get type captcha

      const captchaType=await page.evaluate(()=>{
        const cloudfareElement = document.querySelector('[name="cf-turnstile-response"]'); 
        if(cloudfareElement)
          return 'CloudflareTurnstile';

        return 'None'
        
      })
      captchaType_ = captchaType as CaptchaType;


      //get some logs of htt errors
      [udemy, isCaptchaFailed] = await getHttpRequestErrors(page,captchaType_,udemy, isCaptchaFailed);

           
      const categories = await getAllCategories(page);
      
      const insertCategories= await homepageModule.insertCategoriesCourses(categories)
      
      
      scrapedData = await getAllCoursesByCategory(page, categories, scrapedData);

      const insertCourses = await homepageModule.insertCourses(scrapedData);

      console.log("length " + scrapedData.length);


      //save scraped data to json to test

      const jsonString = JSON.stringify(scrapedData,null, 2);
      fs.writeFile('scrapedData.json', jsonString, (err)=>{
        if (err) {
          console.log("error writing file "+ err);
        }
        else
        {
          console.log("scraped data has been saved in scrapedData.json");
        }
      });

      //save length for testing
      const saveLength = JSON.stringify(scrapedData.length, null, 2);
      fs.writeFile('length.json', saveLength, (err)=>{
        if (err) {
          console.log("error writing file "+ err);
        }
        else
        {
          console.log("scraped data has been saved in scrapedData.json");
        }
      });
      
      logger.info(`Scraping completed. ${scrapedData.length} courses found.`);
    } catch (error: any) {
      logger.error(`Error scraping Udemy: ${error.message}`);
      logger.error(error)
    } finally {
       await browser.close();
    }
  }
  await browser.close();
  return scrapedData;
}

//get all categories
async function getAllCategories(page:Page):Promise<Category[]> {

  const categories = await page.evaluate(() => {
    const categoriesElements = document.querySelectorAll(
      '[class*="list-menu-module"]'
    );
    const categoriesData: Category[] = [];
    categoriesElements.forEach((categoriesElement) => {

      const anchorEl = categoriesElement as HTMLAnchorElement;

      if (!anchorEl.href) return;
      categoriesData.push({
        name: anchorEl.textContent?.trim() as string,
        url: anchorEl?.href,
        currentPage:0,
        maxPage:0,
      });

    });
    return categoriesData;
  });
  return categories
}

// get all categories
async function getAllCoursesByCategory(page:Page, categories:Category[], scrapedData :Course[]): Promise<Course[]> {

  
  try {
    let nextLink: string;
    const typeCourse = TypeCourse.Udemy;
   // let i=0;
    //loop throu all categories
    for (const category of categories) {
      nextLink = category.url;
      console.log(category.url)
      
      while (nextLink != null && nextLink != ""  && i<=1) {
        //console.log(nextLink);
        await page.goto(nextLink, { waitUntil: "networkidle2" });

        // Wait for the course elements to appear on the page
        await page.waitForFunction(() => {
          //let index=0;
          const nextButton = document.querySelector('[class*="pagination-module--next"]') as HTMLAnchorElement;
          const courseElements = document.querySelectorAll('[class*="course-list--card-layout-container"]');
          const priceElement = document.querySelectorAll('[class*="course-list--card-layout-container"] [data-purpose*="course-price-text"]');


          // If the ‘next page’ button is not present on the page, it returns ‘false’ to continue waiting.
          if (courseElements.length != priceElement.length || nextButton == null || courseElements.length ==0 || priceElement.length==0 || nextButton.previousSibling == null || nextButton.previousSibling == undefined ) return false;

          // verify if all prices are available
          console.log("tamanho course elements "+ courseElements.length)
          console.log("size "+ priceElement.length )
         
          return true;
          // Checks if the ‘previousSibling’ of the ‘next page’ button is different from ‘null’ and ‘undefined’.
          // If it is different, it means that the required element has been loaded, and then returns ‘true’, 
          // causing `waitForFunction` to stop waiting.
        }, { timeout: 1000000 });
        

        // Scraping course data
        let { courseData, nextLink_ } = await page.evaluate(( category:Category, typeCourse:TypeCourse) => {
          //const courseElements = document.querySelectorAll('.popper-module--popper--mM5Ie');
          //const courseElements = document.querySelectorAll('[class*="popper-module--popper"]');
          const courseElements = document.querySelectorAll('[class*="course-list--card-layout-container"]');
          const courseData: Course[] = [];
          
          for (const courseElement of Array.from(courseElements)) {


            /*if (courseElement.closest('[class*="carousel-module--container"]')) {
              continue; // Skip the loop if it's inside a tab-container or carousel
            }*/

            //get title
            const titleElement = courseElement.querySelector('h3[data-purpose="course-title-url"] a');
            if (titleElement == undefined) continue;
            const title = titleElement ? titleElement.childNodes[0].textContent?.trim() : null;
            const link = titleElement  ? `https://www.udemy.com${titleElement.getAttribute("href")}` : null;
         
            //get description
            const descriptionElement = courseElement.querySelector('[class*="course-card-module--course-headline"]');
            const description = descriptionElement?.textContent?.trim();

            //get rating
            const ratingWrapper = courseElement.querySelector('[class*="star-rating-module"] [data-purpose="rating-number"]');
            const rating = ratingWrapper ? parseFloat(ratingWrapper.textContent || "0"): 0;

            //get max possible rating
            const ratingMaxwrapper = courseElement.querySelector('[class*="star-rating-module"] [class*="ud-sr-only"]');
            let ratingMax = 0;
            if (ratingMaxwrapper) {
              const ratingMaxText = ratingMaxwrapper.textContent?.trim(); // Get the text and remove extra spaces

              if (ratingMaxText) {
                const lastNumber = ratingMaxText.match(/\d+$/); // Extracts the last number from the string

                if (lastNumber) {
                  ratingMax = parseInt(lastNumber[0]); // Show the last number found
                }
              }
            }

            //get price
            const priceElement = courseElement.querySelector('[data-purpose*="course-price-text"]')?.childNodes[1].childNodes[0];
            const priceInfo = priceElement? priceElement.textContent?.trim(): null;
            let price = 0;
            let currency = "";
            if (priceInfo) {
              // Regular expression to capture the numeric value and currency
              const match = priceInfo.match(/([^\d.,]+)?([\d.,]+)/);
              if (match) {
                currency = match[1]?.trim() || "";  // The currency symbol
                price = parseFloat(match[2].replace(",", ".")); // The numeric value
              }
            }

            //get authors
            const authorsElement = courseElement.querySelector('[class*="course-card-instructors-module--instructor-list"]');
            const authors = authorsElement?.textContent?.trim();

            //number reviews
            const numberReviewsElement = courseElement.querySelector('[class*="course-card-ratings-module--reviews-text"]');
            const numberReviewsInfo =numberReviewsElement?.textContent?.trim();
            let numberReviews = 0;

            if (numberReviewsInfo) {
              const match = numberReviewsInfo.match(/([\d.,]+)/);
              if (match) {
                numberReviews = parseFloat(match[1].replace(/,/g, ''));
              }
            }

            //card details= total hours, classes, levels
            const cardInfoElement = courseElement.querySelector('[data-purpose*="course-meta-info"]');
            const totalHoursText = cardInfoElement?.childNodes[0]?.textContent?.trim();
            let totalHours =0;
            
            if (totalHoursText) {
              const match = totalHoursText.match(/([\d.,]+)/);
              if (match) {
                totalHours = parseFloat(match[1]);
              }
            }

            //number of classes
            const classesText = cardInfoElement?.childNodes[1]?.textContent?.trim();
            let classes = 0;

            if (classesText) {
              const match = classesText.match(/([\d.,]+)/);
              if (match) {
                classes = parseFloat(match[1]);
              }
            }


            const level = cardInfoElement?.childNodes[2]?.textContent?.trim();

            courseData.push({
              title: title || "",
              link: link || "",
              rating,
              ratingMax,
              price: price || 0,
              currency,
              description: description|| "",
              authors: authors || "",
              numberReviews,
              totalHours,
              classes,
              level: level || "",
              categoryName: category.name,
              typeCourse: typeCourse
            });

            if(courseData[courseData.length-1].price == 0){
              throw new Error("no price found, need more time to load all rsources" );
              
            }
          }

          const buttonNextPage = document.querySelector('[class*="pagination-module--next"]') as HTMLAnchorElement;
          let nextLink_ = "";
      
          if (buttonNextPage) {
            //console.log(buttonNextPage.href as string);
            nextLink_ = buttonNextPage.href as string;
          }

          return { courseData, nextLink_ };
        }, category, typeCourse);

        
        nextLink = nextLink_;
        scrapedData.push(...courseData);
        console.log(scrapedData)
        //i++;
      }
    }
    return scrapedData;
    
  } catch (error) {
      console.log(error)
      return [];
  }

}

//get http request errors, to see if I have to deal if captcha
async function getHttpRequestErrors(page:Page, captchaType_:CaptchaType, udemy:Udemy, isCaptchaFailed:boolean):Promise<[Udemy, boolean]> {
  //get type response
  page.on("response", (response) => {
    if (!response.ok()) {
      // console.error( `Response failed: ${response.url()} - ${response.status()} - ${response.statusText()}` );
      udemy = {
        responseStatus: response.status(),
        responseUrl: response.url(),
        typeCaptcha: captchaType_,
      };
    }
    if (response.ok()) {
      // console.log( `not failed: ${response.url()} - ${response.status()} - ${response.statusText()}` );
      isCaptchaFailed = false;
      udemy = {
        responseStatus: response.status(),
        responseUrl: response.url(),
        typeCaptcha: captchaType_,
      };
    }
  });

  //always try if captcha fail
  while (isCaptchaFailed) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(5000);

    page.on("response", (response) => {
      if (!response.ok()) {
        //  console.error( `Response failed: ${response.url()} - ${response.status()} - ${response.statusText()}` );
        udemy = {
          responseStatus: response.status(),
          responseUrl: response.url(),
          typeCaptcha: captchaType_,
        };
      }
      if (response.ok()) {
        //console.log( `not failed: ${response.url()} - ${response.status()} - ${response.statusText()}` );
        isCaptchaFailed = false;
        udemy = {
          responseStatus: response.status(),
          responseUrl: response.url(),
          typeCaptcha: captchaType_,
        };
      }
    });
  }
  return [udemy, isCaptchaFailed];
}



//get the maximum number of pages for all categories, dont need this anymore
async function getMaxpagesCategories(page:Page, categories:Category[]): Promise<Category[]>{
  try {

    //loop throu all categories
    let nextLink="";
    for(let category of categories){

      nextLink = category.url;

      await page.goto(nextLink, { waitUntil: "networkidle2" });

      await page.waitForFunction(() => {
        const nextButton = document.querySelector('[class*="pagination-module--next"]') as HTMLAnchorElement;
          
        if (!nextButton) return false;

        return nextButton.previousSibling !== null && nextButton.previousSibling !== undefined;
      }, { timeout: 1000000 });
      
      const lastPageNumeber = await page.evaluate(() => {
          
        //get next page button
        const buttonNextPage = document.querySelector('[class*="pagination-module--next"]') as HTMLAnchorElement;
        //get max paeg number
        const lastPageNumberElement = buttonNextPage?.previousSibling;//get max number
        if(lastPageNumberElement==null){
          debugger
        }
        const lastPageNumber = lastPageNumberElement?.textContent as unknown as string;
        return  parseFloat(lastPageNumber);

        });
        category.maxPage=lastPageNumeber;
    }
    
    return categories;
  } catch (error) {
    debugger
    console.log(error);
    throw error;
  }
  
}