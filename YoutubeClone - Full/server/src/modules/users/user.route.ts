import { Router } from "express";
import { registerUserHandler } from "./user.controller";
import validateResource from "../../middlewares/validateResources";
import { createUserSchema } from "./user.schema";

const router = Router();

router.get("/", (req, res) => {
  res.send("Get me route");
});

router.post("/", validateResource(createUserSchema), registerUserHandler);
export default router;
