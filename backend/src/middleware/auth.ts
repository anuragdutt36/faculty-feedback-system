import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/index.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { UserRole } from "../models/user.model.js";
import { env } from "../config/env.js";

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token = req.cookies?.accessToken;

  // Fallback to Authorization header if no cookie is found (useful for APIs outside browser)
  if (!token) {
    const authHeader = req.headers.authorization || (req.headers.Authorization as string);
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res
      .status(401)
      .json(ApiResponse.error("Unauthorized: Access token missing"));
  }

  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as any;
    if (!decoded || !decoded.id || !decoded.role) {
      return res
        .status(401)
        .json(ApiResponse.error("Unauthorized: Invalid token payload"));
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role as UserRole,
      institutionId: decoded.institutionId,
    };
    next();
  } catch (error: any) {
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
