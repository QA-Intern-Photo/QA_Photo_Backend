import * as s from "superstruct";
import isEmail from "is-email";

export const CreateUser = s.object({
  email: s.define("Email", isEmail) && s.size(s.string(), 1, 100),
  nickname: s.size(s.string(), 1, 50),
  password: s.size(s.string(), 1, 50)
});
