import { Request, Response } from "express";

export default function loginHandler(req: Request, res: Response) {
  // We will use ZOD to make sure we have this data available
  const { email, password } = req.body;

  // Verify the details
  // const user = await

  // Sign a JWT Token

  // Set cookie
}
