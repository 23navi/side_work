import { Router } from "express";
import { registerUserHandler } from "./user.controller";

const router = Router();

router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.post("/", registerUserHandler);
export default router;
