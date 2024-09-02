import { ScraperService } from './services/scraperService';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const scraperService = new ScraperService();
const searchTerm = 'c++';  // Exemplo de termo de busca

async function main() {
  logger.info(`Iniciando scraping para o termo: "${searchTerm}"`);
  const courses = await scraperService.scrapeCourses(searchTerm);
  console.log(courses);
}

main();
