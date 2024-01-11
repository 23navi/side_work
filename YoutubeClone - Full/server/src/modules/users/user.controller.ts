import type { Request, Response } from "express";
import type { CreateUserBody } from "./user.schema";
import { createUser } from "./user.service";
import { StatusCodes } from "http-status-codes";
export const registerUserHandler = async (
  req: Request<{}, CreateUserBody>,
  res: Response
) => {
  const { email, username, password } = req.body;
  try {
    const newUser = await createUser({ email, username, password });
    return res
      .status(StatusCodes.CREATED)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "User already exists" });
    }
  }
};
