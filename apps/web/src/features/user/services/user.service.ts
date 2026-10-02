import { apiClient } from "@/lib/axios";
import type { UserProfile, UpdateProfileRequest, AvatarCrop } from "../types/user.types";

export const userService = {
  me() {
    return apiClient.get<UserProfile>("/users/me");
  },

  findById(userId: string) {
    return apiClient.get<UserProfile>(`/users/${userId}`);
  },

  updateProfile(data: UpdateProfileRequest) {
    return apiClient.patch<UserProfile>("/users/me", data);
  },

  updateAvatar(avatarFile: File, crop: AvatarCrop) {
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    formData.append("crop", new Blob([JSON.stringify(crop)], { type: "application/json" }));
    return apiClient.put<UserProfile>("/users/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateAvatarCrop(crop: AvatarCrop) {
    return apiClient.patch<UserProfile>("/users/me/avatar/crop", crop);
  },

  removeAvatar() {
    return apiClient.delete<UserProfile>("/users/me/avatar");
  },
};
