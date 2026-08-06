import { Request } from "express";
import { UserRole } from "../models/user.model.js";

export interface IRequestUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: IRequestUser;
}
