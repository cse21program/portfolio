import { AppError, ErrorCode } from "@common/errors/AppError";
import { persistUploadedFile } from "@modules/media/media.files";
import { publicFileUrl } from "@modules/media/media.storage";
import { authRepository } from "@modules/auth/auth.repository";
import { toPublicUser } from "@modules/auth/auth.service";
import type { UpdateProfileInput } from "./users.validation";

export const usersService = {
  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
    }
    return toPublicUser(user);
  },

  async update(userId: string, input: UpdateProfileInput) {
    const updated = await authRepository.updateUser(userId, {
      name: input.name,
      phone: input.phone,
      country: input.country,
      notifyProduct: input.notifyProduct,
      notifyMarketing: input.notifyMarketing,
    });
    return toPublicUser(updated);
  },

  async updateAvatar(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Choose a photo to upload", 400);
    }
    void persistUploadedFile(file);
    const updated = await authRepository.updateUser(userId, {
      imageUrl: publicFileUrl(file.filename),
    });
    return toPublicUser(updated);
  },

  async removeAvatar(userId: string) {
    const updated = await authRepository.updateUser(userId, { imageUrl: null });
    return toPublicUser(updated);
  },
};
