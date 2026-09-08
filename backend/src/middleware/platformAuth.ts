import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PlatformAuthenticatedRequest } from "../types/index.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { PlatformAdminRole } from "../models/platformAdmin.model.js";
import { env } from "../config/env.js";

export const authenticatePlatformAdmin = (
  req: PlatformAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization || (req.headers.Authorization as string);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json(ApiResponse.error("Unauthorized: Platform admin token missing or invalid"));
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json(ApiResponse.error("Unauthorized: Platform admin token missing"));
  }

  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as any;
    if (!decoded || !decoded.id || !decoded.isPlatformAdmin) {
      return res
        .status(401)
        .json(ApiResponse.error("Unauthorized: Invalid platform admin token"));
    }

    req.platformAdmin = {
      id: decoded.id,
      username: decoded.username,
      name: decoded.name || "Platform Admin",
      role: decoded.role as PlatformAdminRole,
      isPlatformAdmin: true,
    };
    next();
  } catch (error: any) {
    return res
      .status(401)
      .json(ApiResponse.error("Unauthorized: Platform access token expired or invalid"));
  }
};

export const authorizePlatformRole = (...allowedRoles: PlatformAdminRole[]) => {
  return (req: PlatformAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.platformAdmin) {
      return res
        .status(401)
        .json(ApiResponse.error("Unauthorized: Platform admin not authenticated"));
    }

    if (!allowedRoles.includes(req.platformAdmin.role)) {
      return res
        .status(403)
        .json(
          ApiResponse.error(
            "Forbidden: You do not have sufficient platform permissions"
          )
        );
    }

    next();
  };
};
