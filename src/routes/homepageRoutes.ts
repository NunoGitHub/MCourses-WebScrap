import express, { Request, Response } from "express";
import * as homepageModel from "../models/homepage";
const homepageRouter = express.Router();

homepageRouter.get("/", async (req: Request, res: Response) => {
  try {
    homepageModel
      .GethomepageCourses()
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch((err) => {
        return res.status(500).json({ Error: "Error searching for courses" });
      });
  } catch (error) {
    return res.status(500).json(error);
  }
});

export { homepageRouter };