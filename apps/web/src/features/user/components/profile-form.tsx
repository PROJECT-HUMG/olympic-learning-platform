import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PageSection } from "@/components/ui/page-section";
import { useUpdateProfile } from "../hooks/use-update-profile";
import type { UserProfile } from "../types/user.types";

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ và tên phải chứa ít nhất 2 ký tự")
    .max(100, "Họ và tên không vượt quá 100 ký tự"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: UserProfile;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const updateProfileMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName || "",
    },
  });

  function onSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(data, {
      onSuccess: (response) => reset({ fullName: response.data.fullName || "" }),
    });
  }

  return (
    <PageSection title="Thông tin cá nhân" description="Tên và thông tin dùng để nhận diện tài khoản của bạn.">
      <form onSubmit={handleSubmit(onSubmit)} className="profile-details">
        <div className="profile-details__name">
          <FormField id="profile-fullname" type="text" label="Họ và tên" autoComplete="name"
            error={errors.fullName?.message} disabled={updateProfileMutation.isPending} {...register("fullName")} />
          <p className="profile-details__hint">Tên này xuất hiện trong phòng học và những nội dung bạn chia sẻ.</p>
        </div>
        <dl className="profile-facts">
          <div><dt>Địa chỉ email</dt><dd>{user.email}</dd></div>
          <div><dt>Tên đăng nhập</dt><dd>@{user.username}</dd></div>
          {user.lastLoginAt && <div><dt>Đăng nhập gần nhất</dt><dd>{new Date(user.lastLoginAt).toLocaleString("vi-VN")}</dd></div>}
        </dl>
        <div className="profile-details__footer">
          <p role="status">{isDirty ? "Bạn có thay đổi chưa lưu." : "Thông tin đã được đồng bộ."}</p>
          <Button type="submit" disabled={!isDirty || updateProfileMutation.isPending} loading={updateProfileMutation.isPending}>
            <Save aria-hidden="true" />Lưu thay đổi
          </Button>
        </div>
      </form>
    </PageSection>
  );
}
