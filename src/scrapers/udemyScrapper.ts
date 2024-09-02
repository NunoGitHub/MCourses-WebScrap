import puppeteer from "puppeteer-extra";
import { Course } from "../types/course";
import { logger } from "../utils/logger";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {  CaptchaType } from "../enums/captchaType";
import { Udemy } from "../types/udemy";

// Função para scrapear a Udemy
export async function scrapeUdemyCourses( searchTerm: string ): Promise<Course[]> {

  logger.info(`Iniciando scraping para Udemy com o termo: ${searchTerm}`);
  let scrapedData: any[] = [];
  let captchaType_ :CaptchaType = CaptchaType.None;
  let udemy : Udemy ={
    responseStatus:0,
    responseUrl:"",
    typeCaptcha: CaptchaType.None,
  };

  let isCaptchaFailed: boolean = true;

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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
      "--window-size=1080,1900", // Define o tamanho da janela para uma melhor renderização
    ],
  });

  const page = await browser.newPage();
  const courses: Course[] = [];
  if (!searchTerm) {
    throw new Error("searchTerm is undefined or empty");
  }
  while (scrapedData?.length <= 1 || scrapedData == null) {
    try {
      // Defina cabeçalhos HTTP para simular um navegador real
      await page.setExtraHTTPHeaders({
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      });

      const baseUrl = "https://www.udemy.com";

      // Vá até a página principal para pegar todas as categorias
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle2" });

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Simule interações humanas para evitar a detecção de bots
      //Função para esperar por um determinado tempo (em milissegundos)
     

      // Em seu código principal
      await delay(Math.random() * 2000 + 1000); // Espera aleatória entre 1s e 3s // Espera aleatória entre 1s e 3s

      await page.setCacheEnabled(true);

      //get type captcha

      const captchaType=await page.evaluate(()=>{
        const cloudfareElement = document.querySelector('[name="cf-turnstile-response"]'); 
        if(cloudfareElement)
          return 'CloudflareTurnstile';

        return 'None'
        
      })
      captchaType_ = captchaType as CaptchaType;

      //get type response
      page.on("response", (response) => {

        if (!response.ok()) {
         // console.error( `Response failed: ${response.url()} - ${response.status()} - ${response.statusText()}` ); 
          udemy = {
            responseStatus: response.status(),
            responseUrl: response.url(),
            typeCaptcha : captchaType_
          }


        }
          if (response.ok()) {
           // console.log( `not failed: ${response.url()} - ${response.status()} - ${response.statusText()}` ); 
            isCaptchaFailed= false;
            udemy = {
              responseStatus: response.status(),
              responseUrl: response.url(),
              typeCaptcha : captchaType_
            }
          }
      });

      //always try if captcha fail
      while(isCaptchaFailed){

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await delay(5000);



        page.on("response", (response) => {
          if (!response.ok()) {
          //  console.error( `Response failed: ${response.url()} - ${response.status()} - ${response.statusText()}` ); 
            udemy = {
              responseStatus: response.status(),
              responseUrl: response.url(),
              typeCaptcha : captchaType_
            }
  
  
          }
            if (response.ok()) {
              //console.log( `not failed: ${response.url()} - ${response.status()} - ${response.statusText()}` ); 
              isCaptchaFailed= false; 
              udemy = {
                responseStatus: response.status(),
                responseUrl: response.url(),
                typeCaptcha : captchaType_
              }
            }
        });
           
        
      }

      


       /* const shadowHostSelector = 'body > div > div > div > div > div > div';
        const iframeSelector = 'iframe';

        const shadowHost = await page.waitForSelector(shadowHostSelector);
        console.log(shadowHost)
         // Acessa o Shadow Root do shadow host
          // Tentar acessar o Shadow Root
        const shadowRootHandle = await shadowHost!.evaluateHandle((shadowHost) => {
          // Verifique se o shadowRoot está acessível
          console.log(shadowHost.shadowRoot)
          debugger
          return shadowHost.shadowRoot ? shadowHost.shadowRoot : null;
        });
        console.log(shadowRootHandle)*/
        // Dentro do Shadow Root, encontra o iframe
       /* const iframeHandle  = await page.evaluateHandle((shadowHostSelector, iframeSelector) => {
          const shadowHost = document.querySelector(shadowHostSelector);
          debugger
          if (!shadowHost || !shadowHost.shadowRoot) return null;
          const shadowRoot = shadowHost.shadowRoot;
          const iframe = shadowRoot.querySelector(iframeSelector) as HTMLIFrameElement;
          debugger
          if (iframe) {
            return {iframe, shadowHost}; // Retorna o contentWindow do iframe
          }
          return null;
        }, shadowHostSelector, iframeSelector);

        debugger

        if (!iframeHandle) {
          console.error('Iframe não encontrado dentro do Shadow DOM');
          debugger
        }
        else
        {
          debugger
          console.log("found iframe")
        }

        const elementHandle =  iframeHandle.asElement(); // Usa contentFrame() para acessar o conteúdo do iframe
        if (!elementHandle) {
          console.error('Não foi possível acessar o conteúdo do iframe');
          
        }
        const frame = await elementHandle!.contentFrame();
      
        //#document > html > body > shadow root closed> div> div  > div > div > label >input

        debugger
*/
      

      
      //await page.goto(`${baseUrl}/courses/`, { waitUntil: "networkidle2" });
   
     
      //const content = await page.content();
      // console.log(content);

      //if we get cloudfare 
     

      // get all categories
      const categories = await page.evaluate(() => {
        const categoriesElements = document.querySelectorAll(
          '[class*="list-menu-module"]'
        );
        const categoriesData: any[] = [];
        categoriesElements.forEach((categoriesElement) => {

          const anchorEl = categoriesElement as HTMLAnchorElement;

          if (!anchorEl.href) return;
          categoriesData.push({
            name: anchorEl.textContent?.trim(),
            url: anchorEl?.href,
          });

        });
        return categoriesData;
      });

      let indexPage = 0;
      let nextLink: string;
      
      //loop throu all categories
      for (const categorie of categories) {
        let nextPage = false;
        nextLink = categorie.url;
        console.log(categorie.url)

        while (nextLink != null || nextLink != "") {
          console.log(nextLink);
          await page.goto(nextLink, { waitUntil: "networkidle2" });

          // Aguarda os elementos dos cursos aparecerem na página
          await page.waitForFunction(() => {
            return !!document.querySelector('[class*="popper-module--popper"]') ||  !!document.querySelector('class*="pagination-module--next"'); }, { timeout: 1000000 }); 

          // Scraping dos dados dos cursos
          let { courseData, nextLink_ } = await page.evaluate(() => {
            //const courseElements = document.querySelectorAll('.popper-module--popper--mM5Ie');
            const courseElements = document.querySelectorAll('[class*="popper-module--popper"]');
            const courseData: any[] = [];
            
            for (const courseElement of Array.from(courseElements)) {


              if (courseElement.closest('[class*="carousel-module--container"]')) {
                continue; // Pula o loop se estiver dentro de "tab-container" ou carousel
              }

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
                const ratingMaxText = ratingMaxwrapper.textContent?.trim(); // Obtém o texto e remove espaços extras

                if (ratingMaxText) {
                  const lastNumber = ratingMaxText.match(/\d+$/); // Extrai o último número da string

                  if (lastNumber) {
                    ratingMax = parseInt(lastNumber[0]); // Mostra o último número encontrado
                  }
                }
              }

              //get price
              const priceElement = courseElement.querySelector('[data-purpose*="course-price-text"]')?.childNodes[1].childNodes[0];
              const priceInfo = priceElement? priceElement.textContent?.trim(): null;
              let price = 0;
              let currency = "";
              if (priceInfo) {
                // Expressão regular para capturar o valor numérico e a moeda
                const match = priceInfo.match(/([^\d.,]+)?([\d.,]+)/);
                if (match) {
                  currency = match[1]?.trim() || ""; // O símbolo da moeda
                  price = parseFloat(match[2].replace(",", ".")); // O valor numérico
                }
              }

              //get authors
              const authorsElement = courseElement.querySelector('[class*="course-card-instructors-module--instructor-list"]');
              const authors = authorsElement?.textContent?.trim();

              //number reviews
              const numberReviewsElement = courseElement.querySelector('[class*="course-card-ratings-module--reviews-text"]');
              const numberReviewsInfo =numberReviewsElement?.textContent?.trim();
              let numberReviews = "";

              if (numberReviewsInfo) {
                const match = numberReviewsInfo.match(/([\d.,]+)/);
                if (match) {
                  numberReviews = match[1];
                }
              }

              //card details= total hours, classes, levels
              const cardInfoElement = courseElement.querySelector('[data-purpose*="course-meta-info"]');
              const totalHours =
                cardInfoElement?.childNodes[0]?.textContent?.trim();
              const classes = cardInfoElement?.childNodes[1]?.textContent?.trim();
              const level = cardInfoElement?.childNodes[2]?.textContent?.trim();

              courseData.push({
                title,
                link,
                rating,
                ratingMax,
                price,
                currency,
                description,
                authors,
                numberReviews,
                totalHours,
                classes,
                level,
              });
            }

            const buttonNextPage = document.querySelector('[class*="pagination-module--next"]') as HTMLAnchorElement;
            let nextLink_ = "";
           
            if (buttonNextPage) {
              nextPage = true;
              console.log(buttonNextPage.href as string);
              nextLink_ = buttonNextPage.href as string;
            } else 
            {
              console.log("button "+ buttonNextPage);
              debugger
              nextLink_ = "";

            }
          //  console.log(courseData);
            return { courseData, nextLink_ };
          });

          nextLink = nextLink_;
          scrapedData.push(...courseData);

         // console.log(scrapedData)
        }
      }

      //data-purpose="tab-container"

      console.log("ola " + scrapedData.length);

      // Processar os dados e adicionar ao array de cursos
      scrapedData.forEach((data: any) => {
        if (data.title && data.link) {
          courses.push({
            title: data.title,
            link: data.link,
            rating: data.rating,
            maxRating: data.ratingMax,
            price: data.price || "Free",
            currency: data.currency,
            description: data.description,
            authors: data.authors,
            numberReviews: data.numberReviews,
            totalHours: data.totalHours,
            classes: data.classes,
            level: data.level,
          });
        }
      });

      logger.info(`Scraping completo. ${courses.length} cursos encontrados.`);
    } catch (error: any) {
      logger.error(`Erro ao scrapear a Udemy: ${error.message}`);
      logger.error(error)
    } finally {
      // await browser.close();
    }
  }
  await browser.close();
  return courses;
}
