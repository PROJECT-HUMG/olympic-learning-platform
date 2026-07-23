import { apiClient } from "@/lib/axios";
import type { UserProfile, UpdateProfileRequest } from "../types/user.types";

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

  updateAvatar(avatarFile: File) {
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    return apiClient.put<UserProfile>("/users/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  removeAvatar() {
    return apiClient.delete<UserProfile>("/users/me/avatar");
  },
};
