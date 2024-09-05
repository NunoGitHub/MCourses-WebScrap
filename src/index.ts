import { ScraperService } from './services/scraperService';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const scraperService = new ScraperService();
//const searchTerm = 'c++';  // search

async function main() {
  try {
    const courses = await scraperService.scrapeCourses();
  } catch (error) {
    //logger.info(error);
    console.log(error);
  }
}

main();
