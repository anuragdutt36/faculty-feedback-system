import { Request } from "express";
import { UserRole } from "../models/user.model.js";
import { IInstitution } from "../models/institution.model.js";

export interface IRequestUser {
  id: string;
  username: string;
  role: UserRole;
  institutionId?: string;
}

export interface IPlatformAdminUser {
  id: string;
  username: string;
  name: string;
  role: "superadmin" | "admin" | "reviewer";
  isPlatformAdmin: true;
}

export interface AuthenticatedRequest extends Request {
  user?: IRequestUser;
  tenantId?: string;
  institutionId?: string;
  institution?: IInstitution;
}

export interface PlatformAuthenticatedRequest extends Request {
  platformAdmin?: IPlatformAdminUser;
}
