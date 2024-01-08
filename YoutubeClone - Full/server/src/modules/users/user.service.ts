import { UserModel } from "./user.model";
import type { CreateUserBody } from "./user.schema";

export const createUser = async (
  user: Omit<CreateUserBody, "passwordConfirmation">
) => {
  return UserModel.create(user);
};
