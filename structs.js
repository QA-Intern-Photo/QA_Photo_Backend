import * as s from "superstruct";
import isEmail from "is-email";

export const CreateUser = s.object({
  email: s.define("Email", isEmail) && s.size(s.string(), 1, 100),
  nickname: s.size(s.string(), 1, 50),
  password: s.size(s.string(), 1, 50)
});

export const LoginUser = s.partial(CreateUser);

//card
const GENRE = ["PORTRAIT", "LANDSCAPE", "OBJECT", "TRIP"];
const GRADE = ["COMMON", "RARE", "SUPER_RARE", "LEGENDARY"];

export const CreateCard = s.object({
  name: s.string(),
  description: s.string(),
  genre: s.enums(GENRE),
  grade: s.enums(GRADE),
  price: s.string(),
  totalQuantity: s.string()
});
