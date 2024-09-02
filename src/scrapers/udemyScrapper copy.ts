import puppeteer from 'puppeteer-extra';
import { Course } from '../types/course';
import { logger } from '../utils/logger';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Função para scrapear a Udemy
export async function teste(searchTerm: string): Promise<Course[]> {
  logger.info(`Iniciando scraping para Udemy com o termo: ${searchTerm}`);
  let scrapedData:any[]=[];
  
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({ 
    headless: true, 
    devtools: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--ignore-certificate-errors',
      '--window-size=1080,1900' // Define o tamanho da janela para uma melhor renderização
    ],
  });

  const page = await browser.newPage();
  const courses: Course[] = [];
  if (!searchTerm) {
    throw new Error("searchTerm is undefined or empty");
}
while(scrapedData.length<=1){
 
  try { 

     // Defina cabeçalhos HTTP para simular um navegador real
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
  });

   

    const searchUrl = "https://www.udemy.com/courses/search/?q="+encodeURIComponent(searchTerm);
    

    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    page.on('response', response => {
      if (!response.ok()) {
        console.error(`Response failed: ${response.url()} - ${response.status()} - ${response.statusText()}`);
      }
    });

  

   await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Simule interações humanas para evitar a detecção de bots
   //Função para esperar por um determinado tempo (em milissegundos)
   const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
   
   // Em seu código principal
   await delay(Math.random() * 2000 + 1000); // Espera aleatória entre 1s e 3s // Espera aleatória entre 1s e 3s


   await page.setCacheEnabled(true);
 
    //const content = await page.content();
   // console.log(content);

    // Aguarda os elementos dos cursos aparecerem na página
   await page.waitForSelector('[class*="popper-module--popper"]', { timeout: 60000 });

    // Scraping dos dados dos cursos
     scrapedData = await page.evaluate(() => {
      //const courseElements = document.querySelectorAll('.popper-module--popper--mM5Ie');
      const courseElements = document.querySelectorAll('[class*="popper-module--popper"]');
      const courseData: any[] = []; 

      courseElements.forEach((courseElement) => {

        //get title
        const titleElement = courseElement.querySelector('h3[data-purpose="course-title-url"] a');
        if(titleElement == undefined) return;
        const title = titleElement ? titleElement.childNodes[0].textContent?.trim() : null;
        const link = titleElement ? `https://www.udemy.com${titleElement.getAttribute('href')}` : null;

        //get description
 
        const descriptionElement = courseElement.querySelector('[class*="course-card-module--course-headline"]');
        const description = descriptionElement?.textContent?.trim();
        
        //get rating
        const ratingWrapper = courseElement.querySelector('[class*="star-rating-module"] [data-purpose="rating-number"]');
        const rating = ratingWrapper? parseFloat(ratingWrapper.textContent || '0') : 0;

        //get max possible rating
        const ratingMaxwrapper = courseElement.querySelector('[class*="star-rating-module"] [class*="ud-sr-only"]');
        let ratingMax=0;
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
        const priceInfo = priceElement ? priceElement.textContent?.trim() : null;
        let price =0;
        let currency="";
        if (priceInfo) {
          // Expressão regular para capturar o valor numérico e a moeda
          const match = priceInfo.match(/([^\d.,]+)?([\d.,]+)/);
          if (match) {
            currency = match[1]?.trim() || ""; // O símbolo da moeda
            price = parseFloat( match[2].replace(",", ".")); // O valor numérico
          }
        }
        
        //get authors
        const authorsElement = courseElement.querySelector('[class*="course-card-instructors-module--instructor-list"]');
        const authors = authorsElement?.textContent?.trim();

        //number reviews
        const numberReviewsElement = courseElement.querySelector('[class*="course-card-ratings-module--reviews-text"]');
        const numberReviewsInfo = numberReviewsElement?.textContent?.trim();
        let numberReviews="";
        if(numberReviewsInfo){
          const match = numberReviewsInfo.match(/([\d.,]+)/);
          if(match){
            numberReviews= match[1];
          }
        }
        
        //card details= total hours, classes, levels
        const cardInfoElement = courseElement.querySelector('[data-purpose*="course-meta-info"]');
        const totalHours =cardInfoElement?.childNodes[0]?.textContent?.trim();
        const classes = cardInfoElement?.childNodes[1]?.textContent?.trim();
        const level= cardInfoElement?.childNodes[2]?.textContent?.trim();

        courseData.push({ title, link, rating, ratingMax, price, currency, description, authors, numberReviews, totalHours, classes, level }); 
      });
 
      return courseData;
    });
 
    console.log("ola "+scrapedData.length) 

    // Processar os dados e adicionar ao array de cursos
    scrapedData.forEach((data) => { 
      if (data.title && data.link) {  
        courses.push({
          title: data.title,
          link: data.link,
          rating: data.rating,  
          maxRating: data.ratingMax,
          price: data.price || 'Free',
          currency: data.currency,
          description : data.description,
          authors: data.authors,
          numberReviews: data.numberReviews,
          totalHours: data.totalHours,
          classes: data.classes,
          level: data.level
        });
      }
    });

    logger.info(`Scraping completo. ${courses.length} cursos encontrados.`);
  
  } catch (error:any) {
    logger.error(`Erro ao scrapear a Udemy: ${error.message}`);
  } finally {
    await browser.close();
  }
}
  return courses;
  
}
