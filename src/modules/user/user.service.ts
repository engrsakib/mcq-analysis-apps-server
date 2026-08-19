import ApiError from "@/middlewares/error";
import { IUser, USER_STATUS } from "./user.interface";
import { UserModel } from "./user.model";
import { HttpStatusCode } from "@/lib/httpStatus";
import { BcryptInstance } from "@/lib/bcrypt";
import { OTPService } from "../otp/otp.service";
import { IOtpVerify } from "../otp/otp.interface";
import { Types } from "mongoose";
import JwtHelper from "@/helpers/jwtHelper";
import {
  IChangePassword,
  ILoginCredentials,
  IResetPassword,
} from "@/interfaces/common.interface";

import { IRoles, ROLES } from "@/constants/roles";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { eventBus } from "@/events/EventBus";
import {
  ActorInfo,
  buildAdminActivityPayload,
} from "@/modules/notification/notification.helpers";

class Service {
  private publishUserRegistered = async (user: IUser) => {
    if (user.role !== ROLES.STUDENT) return;

    await eventBus.publish({
      type: "USER_REGISTERED",
      payload: buildAdminActivityPayload({
        actor: { id: user._id.toString(), name: user.name || "Student" },
        action: "registered",
        entityType: "user",
        entityLabel: user.name || user.phone_number,
        entityId: user._id.toString(),
        module: "user",
      }),
    });
  };

  async create(data: IUser) {
    const isExist = await UserModel.findOne({
      phone_number: data.phone_number,
    });

    if (isExist && !isExist.is_Deleted) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `You already have '${isExist?.role}' account with this phone number. Please use a different phone number to create account or login`
      );
    }

    // if user exists but marked deleted → reactivate with new data
    if (isExist && isExist.is_Deleted) {
      data.password = await BcryptInstance.hash(data.password);

      const updatedUser = await UserModel.findByIdAndUpdate(
        isExist._id,
        { ...data, is_Deleted: false },
        { new: true }
      );

      // await OTPService.sendVerificationOtp(data.phone_number, "user");

      if (data.role === ROLES.STUDENT && updatedUser) {
        await this.publishUserRegistered(updatedUser);
      }

      return updatedUser;
    }
    data.status = USER_STATUS.ACTIVE; // set status to active by default
    data.password = await BcryptInstance.hash(data.password);
    const result = await UserModel.create(data);

    // await OTPService.sendVerificationOtp(data.phone_number, "user");
    if (data.role === ROLES.STUDENT) {
      await this.publishUserRegistered(result);
    }

    return result;
  }

  private publishStudentCreatedByAdmin = async (
    user: IUser,
    actor: ActorInfo
  ) => {
    await eventBus.publish({
      type: "USER_REGISTERED",
      payload: buildAdminActivityPayload({
        actor,
        action: "created",
        entityType: "user",
        entityLabel: `"${user.name || user.phone_number}"`,
        entityId: user._id.toString(),
        module: "user",
        title: "Student Added",
        description: `${actor.name} added student ${user.name || user.phone_number}`,
      }),
    });
  };

  async createByAdmin(data: IUser, actor?: ActorInfo) {
    const isExist = await UserModel.findOne({
      phone_number: data.phone_number,
    });

    if (isExist && !isExist.is_Deleted) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `You already have '${isExist?.role}' account with this phone number. Please use a different phone number to create account or login`
      );
    }

    data.status = USER_STATUS.ACTIVE;
    data.password = await BcryptInstance.hash(data.password);

    if (isExist && isExist.is_Deleted) {
      const updatedUser = await UserModel.findByIdAndUpdate(
        isExist._id,
        {
          ...data,
          is_Deleted: false,
        },
        { new: true }
      );
      if (data.role === ROLES.STUDENT && updatedUser) {
        if (actor) {
          await this.publishStudentCreatedByAdmin(updatedUser, actor);
        } else {
          await this.publishUserRegistered(updatedUser);
        }
      }
      return updatedUser;
    }

    const result = await UserModel.create(data);

    if (data.role === ROLES.STUDENT) {
      if (actor) {
        await this.publishStudentCreatedByAdmin(result, actor);
      } else {
        await this.publishUserRegistered(result);
      }
    }

    return result;
  }

  async verifyAccount(data: IOtpVerify): Promise<{
    access_token: string;
    refresh_token: string;
    user: IUser;
  }> {
    const user = await UserModel.findOne({ phone_number: data.phone_number });

    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found!");
    }

    // prevent already verified account
    if (user?.status === USER_STATUS.ACTIVE) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your account already verified. Please login to your account"
      );
    }
    // verify otp
    await OTPService.verifyOTP(data);

    // update status to active
    await UserModel.findByIdAndUpdate(user._id, {
      status: USER_STATUS.ACTIVE,
      last_login_at: new Date(),
    });

    return this.generateLoginCredentials(user._id);
  }

  async getAllCustomers(options: IPaginationOptions, search_query: string) {
    const {
      limit = 5,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const role = options.role;

    const searchCondition: any = { is_Deleted: false };

    if (role !== undefined && role !== null && role !== "") {
      searchCondition.role = role;
    }

    if (search_query) {
      searchCondition.$or = [
        { name: { $regex: search_query, $options: "i" } },
        { email: { $regex: search_query, $options: "i" } },
        { designation: { $regex: search_query, $options: "i" } },
        { phone_number: { $regex: search_query, $options: "i" } },
      ];
    }

    const result = await UserModel.find(searchCondition)
      .select({ password: 0 })
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (!result) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "user not found");
    }

    const data = result.map((user: any) => {
      let keys: string[] = [];
      if (
        user.permissions &&
        typeof user.permissions === "object" &&
        "key" in user.permissions
      ) {
        keys = (user.permissions as { key: string[] }).key;
      }
      return { ...user, permissions: keys };
    });

    const total = await UserModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data,
    };
  }

  async getUserById(id: string) {
    const data = await UserModel.findById(id).select({ password: 0 }).lean();

    if (!data) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "user not found");
    }
    if (data.is_Deleted) {
      throw new ApiError(HttpStatusCode.GONE, "user has been deleted");
    }

    // remove password from data
    data.password = undefined as any;

    return { ...data };
  }

  async updateUser(id: string, data: Partial<IUser>, actor?: ActorInfo) {
    if (!id) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "User ID is required");
    }
    const duplicatePhone = await UserModel.findOne({
      phone_number: data.phone_number,
      _id: { $ne: id },
    });
    if (duplicatePhone) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `You already have an account with the phone number: ${data.phone_number}. Please use a different phone number`
      );
    }

    const isExist = await UserModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found");
    }

    const updated = await UserModel.findByIdAndUpdate(
      id,
      { ...data },
      { new: true }
    );

    if (updated && actor) {
      await eventBus.publish({
        type: "USER_UPDATED",
        payload: buildAdminActivityPayload({
          actor,
          action: "updated",
          entityType: "user",
          entityLabel: `"${updated.name || updated.phone_number}"`,
          entityId: updated._id.toString(),
          module: "user",
        }),
      });
    }

    return updated;
  }

  async deleteUser(id: string, actor?: ActorInfo) {
    const isExist = await UserModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found");
    }

    const deleted = await UserModel.findByIdAndUpdate(
      id,
      { is_Deleted: true },
      { new: true }
    );

    if (deleted && actor) {
      await eventBus.publish({
        type: "USER_DELETED",
        payload: buildAdminActivityPayload({
          actor,
          action: "deleted",
          entityType: "user",
          entityLabel: `"${deleted.name || deleted.phone_number}"`,
          entityId: deleted._id.toString(),
          module: "user",
        }),
      });
    }

    return deleted;
  }

  private async generateLoginCredentials(id: Types.ObjectId | string): Promise<{
    access_token: string;
    refresh_token: string;
    user: IUser;
  }> {
    const user = await UserModel.findById(id).select({
      password: 0,
    });

    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found");
    }

    const payload: any = {
      id: user?._id.toString(),
      phone_number: user?.phone_number as string,
      role: user?.role as string,
    };
    const { access_token, refresh_token } =
      await JwtHelper.generateTokens(payload);

    return {
      user: user,
      access_token,
      refresh_token,
    };
  }

  async resendVerificationOtp(phone_number: string) {
    const user = await UserModel.findOne({
      phone_number,
    });

    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found!");
    }

    // prevent already verified account
    if (user?.status === USER_STATUS.ACTIVE) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your account already verified. Please login to your account"
      );
    }

    // send verification sms with OTP
    await OTPService.sendVerificationOtp(phone_number, user.role as IRoles);
  }

  async login(data: ILoginCredentials): Promise<{
    access_token: string;
    refresh_token: string;
    user: IUser;
  }> {
    const user = await UserModel.findOne({
      phone_number: data.phone_number,
    });
    if (!user) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "The account you are trying to login is not exist our system. Please create account first"
      );
    }

    if (user.is_Deleted) {
      throw new ApiError(
        HttpStatusCode.GONE,
        "This account has been deleted. Please contact support"
      );
    }

    if (user.status === USER_STATUS.INACTIVE) {
      // send a verification otp
      await OTPService.sendVerificationOtp(
        data.phone_number,
        user.role as IRoles
      );
      throw new ApiError(
        HttpStatusCode.UNAUTHORIZED,
        "Your account is not verified yet. We've sent a verification otp. Please check SMS & verify to access your account"
      );
    }

    const isPasswordMatched = await BcryptInstance.compare(
      data.password,
      user.password
    );

    if (!isPasswordMatched) {
      throw new ApiError(
        HttpStatusCode.UNAUTHORIZED,
        "Invalid credentials. Please try with valid credentials"
      );
    }

    await UserModel.findByIdAndUpdate(user._id, { last_login_at: new Date() });

    return await this.generateLoginCredentials(user._id);
  }

  async getLoggedInUser(id: string) {
    const user = await UserModel.findById(id).select({ password: 0 });

    // console.log(user)

    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found!");
    }

    return user;
  }

  async resetPassword(data: IResetPassword) {
    const user = await UserModel.findOne({ phone_number: data.phone_number });
    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found!");
    }

    const newPassword = await BcryptInstance.hash(data.password);

    await UserModel.findByIdAndUpdate(user._id, { password: newPassword });
  }

  async changePassword(id: string, data: IChangePassword) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found!");
    }

    const isPasswordMatched = await BcryptInstance.compare(
      data.old_password,
      user.password
    );

    if (!isPasswordMatched) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your old password is wrong. Please provide your correct password"
      );
    }

    const newPassword = await BcryptInstance.hash(data.new_password);

    await UserModel.findByIdAndUpdate(user._id, { password: newPassword });
  }

  async saveToken(userId: string, token: string) {
    if (!userId || !token) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "userId and token are required"
      );
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { fcmToken: token.trim() },
      { new: true }
    );

    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
    }

    return {
      userId: user._id.toString(),
      fcmToken: user.fcmToken,
      savedAt: new Date().toISOString(),
    };
  }
}

export const UserService = new Service();
