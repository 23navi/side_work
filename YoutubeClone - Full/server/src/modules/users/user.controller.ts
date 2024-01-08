import type { Request, Response } from "express";
import { UserModel } from "./user.model";
export const registerUserHandler = async (req: Request<{}>, res: Response) => {
  const { email, password, username } = req.body;
  const user = new UserModel({ email, password, username });
  console.log(req.body);
  console.log(user);
  //   await user.save();
  return res.status(200).json({ message: "User registered successfully" });
};
