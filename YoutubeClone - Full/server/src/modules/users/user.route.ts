import { Router } from "express";
import { registerUserHandler } from "./user.controller";
import { processRequestBody } from "zod-express-middleware";
import { createUserSchema } from "./user.schema";

const router = Router();

router.get("/", (req, res) => {
  res.send("Get me route");
});

router.post(
  "/",
  processRequestBody(createUserSchema.body),
  registerUserHandler
);
export default router;
