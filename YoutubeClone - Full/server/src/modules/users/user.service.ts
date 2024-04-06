import { User, UserModel } from "./user.model";
import type { CreateUserBody } from "./user.schema";

export const createUser = async (
  user: Omit<CreateUserBody, "passwordConfirmation">
) => {
  return UserModel.create(user);
};

export async function findUserByEmail(email: User["email"]) {
  return UserModel.findOne({ email });
}
