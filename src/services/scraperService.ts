import { scrapeUdemyCoursesFrontPage } from '../scrapers/udemyScraper';
import { Course } from '../types/course';

export class ScraperService {
  
  async scrapeCourses(): Promise<Course[]> {
    try {
      //get all courses, info front page udemy
    const udemyCourses = await scrapeUdemyCoursesFrontPage();
    return udemyCourses; 
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
