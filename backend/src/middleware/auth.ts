import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/index.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { UserRole } from "../models/user.model.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "knit_access_secret_123_xyz";

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization || req.headers.Authorization as string;

  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json(ApiResponse.error("Unauthorized: Access token missing or invalid"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role as UserRole,
    };
    next();
  } catch (error) {
    return res
      .status(401)
      .json(ApiResponse.error("Unauthorized: Access token expired or invalid"));
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json(ApiResponse.error("Unauthorized: User not authenticated"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json(ApiResponse.error("Forbidden: You do not have permission to access this resource"));
    }

    next();
  };
};
