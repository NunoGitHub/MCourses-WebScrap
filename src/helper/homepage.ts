import  db  from "../database/cockroachConnector";
import { Course } from "../types/course";
const axios = require("axios");

exports.gethomepageCourses = async function () {
    
    let queryString = ` SELECT * FROM courses;`;

    const courses: any = await new Promise((resolve, reject) => {
        db.query(queryString, [], (err, result: any) => {
            if (err) {
                return reject(err);
            }
            return resolve(result);
        });
    });

    return courses.rows;
};


exports.insertCategoriesCourses = async function (categories:any[]) {


    //create multiple values numerated dinamicaly ($1, $2, $3...) to every category
    let createDynamicInsertion = categories.map((_, i) => `($${i + 1})`).join(', ');

    let queryString = `INSERT INTO  categories (name) VALUES ${createDynamicInsertion} ON CONFLICT (name) DO NOTHING;`;

    const insertCategories: any = await new Promise((resolve, reject) => {
        db.query(queryString, categories, (err, result: any) => {
            if (err) {
                return reject(err);
            }
            return resolve(result);
        });
    });

    return insertCategories;
};


exports.getAllCategoriesCourses = async function () {

    let queryString = `SELECT * FROM categories;`;

    const Categories: any = await new Promise((resolve, reject) => {
        db.query(queryString, [], (err, result: any) => {
            if (err) {
                return reject(err);
            }
            return resolve(result);
        });
    });

    return Categories;
};

//if dont exist insert new level
exports.insertIdLevels = async function (levels:any[]) {
   // const uniqueLevels = Array.from(new Set(courses));

    let createDynamicInsertion = levels.map((_, i) => `($${i + 1})`).join(', ');

    const getOrInsertQuery = `
        INSERT INTO levels (name)
        VALUES ${createDynamicInsertion}
        ON CONFLICT (name) DO NOTHING;
    
    `;
        const levelid = await new Promise((resolve, reject) => {
        db.query(getOrInsertQuery, levels, (err, result) => {
            if (err) {
                return reject(err);
            }
            return resolve(result);
        });
    });

    return levelid;
}


//if dont exist insert new level
exports.getIdLevels = async function (levels:any[]) {
    // search_names.name,
     const string = `
       -- Step 1: Create a Common Table Expression (CTE) named 'search_names'
       -- This CTE will hold the names provided in the array along with their positions.
     WITH search_names AS (
         -- Use the 'unnest' function to convert the array of names into a set of rows.
         -- Each row will have a single column 'name'.
         -- 'generate_subscripts' generates an array of positions for each element in the array.
         -- The 'position' column preserves the original order of the names.
         SELECT unnest($1::text[]) AS name, generate_subscripts($1, 1) AS position
     )
     -- Step 2: Select the names and their corresponding IDs
     SELECT COALESCE(levels.id, -1) AS id
     FROM search_names
     -- Perform a LEFT JOIN to include all names from 'search_names' and match with 'levels'.
     -- If a name exists in 'levels', its ID is returned.
     -- If a name does not exist, 'COALESCE' returns -1.
     LEFT JOIN public.levels ON search_names.name = levels.name
     -- Step 3: Order the results by the original position of the names
     -- This ensures that the results are returned in the same order as the input array.
     ORDER BY search_names.position;
 `;
 const levelsid = await new Promise((resolve, reject) => {
     db.query(string, [levels], (err, result) => {
         if (err) {
             return reject(err);
         }
         return resolve(result.rows);
     });
 });
     return levelsid;
 }
 




/**se a primeira for lenta
 * 
 * 
 * 
//if dont exist insert new level, category or type_course
exports.getOrInsertCourseLevels = async function (courses:Course[]) {

    const getOrInsertQuery =`WITH levels AS (
            INSERT INTO levels (name)
            VALUES ($1)
            ON CONFLICT (name) DO NOTHING
            RETURNING id
        ),
        category AS (
            INSERT INTO categories (name)
            VALUES ($2)
            ON CONFLICT (name) DO NOTHING
            RETURNING id
        ),
        type_course AS (
            INSERT INTO type_courses (name)
            VALUES ($3)
            ON CONFLICT (name) DO NOTHING
            RETURNING id
        )
        SELECT 
            COALESCE((SELECT id FROM level), (SELECT id FROM level WHERE name = $1)) AS level_id,
            COALESCE((SELECT id FROM category), (SELECT id FROM category WHERE name = $2)) AS category_id,
            COALESCE((SELECT id FROM type_course), (SELECT id FROM type_course WHERE name = $3)) AS type_course_id;
    `;
        const foreignKeysResult = await new Promise((resolve, reject) => {
        db.query(getOrInsertQuery, [course.level, course.category, course.type_course], (err, result) => {
            if (err) {
                return reject(err);
            }
            return resolve(result.rows[0]);
        });
    });

    return foreignKeysResult;
    
}
 * exports.insertCategoriesCourses = async function (categories:any[]) {

    const values = categories.map(category => [category]);

    let queryString = `INSERT INTO categories (name) VALUES ?;`;

    const courses: any = await new Promise((resolve, reject) => {
        db.query(queryString, [values], (err, result: any) => {
            if (err) {
                return reject(err);
            }
            return resolve(result);
        });
    });

    return courses.rows;
};

 */