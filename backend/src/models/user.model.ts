import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "admin" | "student";
export type UserStatus = "active" | "inactive";

export interface IUser extends Document {
  username: string; // enrollment / email
  password?: string; // optional since students don't have passwords
  role: UserRole;
  status: UserStatus;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: false, // Optional for students using Google OAuth
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "student"],
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
export default User;
