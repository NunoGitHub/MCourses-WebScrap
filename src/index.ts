import dotenv from 'dotenv';

dotenv.config();

import { ScraperService } from './services/scraperService';
import { logger } from './utils/logger';
//import {homepageRouter} from "./routes/homepageRoutes"
import * as homepageModule from "./models/homepage"




const scraperService = new ScraperService();
//const searchTerm = 'c++';  // search
const { Client } = require("pg");



async function main() {
  try {
   // const getCourses = await homepageModule.GethomepageCourses();
    const courses = await scraperService.scrapeCourses();
  } catch (error) {
    //logger.info(error);
    console.log(error);
  }
}

main();

/* try {
    const results = await client.query("SELECT * FROM courses;");
    console.log(results);
  } catch (err) {
    console.error("error executing query:", err);
  } finally {
    client.end();
  } */