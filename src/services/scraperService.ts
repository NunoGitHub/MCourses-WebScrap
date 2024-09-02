import { scrapeUdemyCourses } from '../scrapers/udemyScrapper';
import { Course } from '../types/course';

export class ScraperService {
  async scrapeCourses(searchTerm: string): Promise<Course[]> {
    // Atualmente, apenas o scraper da Udemy está sendo chamado
    const udemyCourses = await scrapeUdemyCourses(searchTerm);
    
    // Aqui, você pode adicionar mais scrapers de outras plataformas
    // const anotherPlatformCourses = await scrapeAnotherPlatformCourses(searchTerm);

    return udemyCourses; // Combine todos os cursos de diferentes plataformas
  }
}
