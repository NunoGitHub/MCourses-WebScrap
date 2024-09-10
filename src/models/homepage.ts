import { Category } from "../types/category";
import { Course } from "../types/course";

const  homepageHelper = require("../helper/homepage");

export async function GethomepageCourses() {

    try {
        const secondHandOrders = await homepageHelper.gethomepageCourses();
        return secondHandOrders;
        
    } catch (error) {
        throw  error;
    }
    
}

export async function insertCategoriesCourses(categories:Category[]) {

    try {
        //get only the name
        const categoriesName = categories.map((cat)=> cat.name);
        const secondHandOrders = await homepageHelper.insertCategoriesCourses(categoriesName);
        return secondHandOrders;
        
    } catch (error) {
        throw  error;
    }
    
}

export async function insertCourses(categories:Course[]) {

    try {
        //get only the name
        const categoriesLevels = categories.map((cat)=> cat.level);
        const levelId = await homepageHelper.insertIdLevels(categoriesLevels);
        const getLevelsId= await homepageHelper.getIdLevels(categoriesLevels); 
        
        return getLevelsId;
        
    } catch (error) {
        throw  error;
    }
    
}