import { TypeCourse } from "../enums/typeCourse";

export interface Course {
  title: string;
  link: string;
  rating: number;
  ratingMax: number;
  price: number;
  currency: string;
  description: string;
  authors: string;
  numberReviews: number;
  totalHours: number;
  classes: number;
  level: string;
  categoryName: string;
  typeCourse: TypeCourse;
  imageLink:string;
}
