import {
  BookOpen,
  Calculator,
  CalendarCheck,
  FileText,
  FileUp,
  FolderTree,
  GraduationCap,
  Home,
  Info,
  LayoutDashboard,
  Newspaper,
  User,
  Users,
  Award,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { ROUTES, getDashboardRoute } from "../router/route-constants";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  aliases?: string[];
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const PUBLIC_PRIMARY_NAVIGATION: NavigationItem[] = [
  { label: "Trang chủ", href: ROUTES.HOME, icon: Home },
  { label: "Môn học", href: ROUTES.SUBJECTS, icon: GraduationCap },
  { label: "Tài liệu", href: ROUTES.DOCUMENTS, icon: FileText },
  { label: "Bảng tin", href: ROUTES.NEWS, icon: Newspaper },
  { label: "Vinh danh", href: ROUTES.HONORS, icon: Award, aliases: [ROUTES.RANKINGS, ROUTES.ACHIEVEMENTS] },
  {
    label: "Tiện ích",
    href: ROUTES.TOOLKIT,
    icon: Calculator,
    aliases: [ROUTES.STUDY_ROOMS],
  },
];

export function getNavigationGroups(role?: string): NavigationGroup[] {
  const groups: NavigationGroup[] = [
    {
      label: "Học tập",
      items: [
        { label: "Môn học", href: ROUTES.SUBJECTS, icon: GraduationCap },
        { label: "Kho tài liệu", href: ROUTES.DOCUMENTS, icon: FileText },
        {
          label: "Phòng học chung",
          href: `${ROUTES.TOOLKIT}?tool=rooms`,
          icon: Users,
          aliases: [ROUTES.STUDY_ROOMS],
        },
        {
          label: "Tính GPA",
          href: `${ROUTES.TOOLKIT}?tool=gpa`,
          icon: Calculator,
        },
      ],
    },
    {
      label: "Thông tin",
      items: [
        { label: "Trang chủ", href: ROUTES.HOME, icon: Home },
        { label: "Bảng tin", href: ROUTES.NEWS, icon: Newspaper },
        { label: "Vinh danh", href: ROUTES.HONORS, icon: Award },
        { label: "Xếp hạng thành tích", href: ROUTES.RANKINGS, icon: Trophy, aliases: [ROUTES.ACHIEVEMENTS] },
        { label: "Giới thiệu", href: ROUTES.ABOUT, icon: Info },
      ],
    },
  ];

  if (role === "ADMIN" || role === "LECTURER") {
    const base = role === "ADMIN" ? "/admin" : "/lecturer";
    groups.push({
      label: "Quản lý nội dung",
      items: [
        { label: "Tài liệu", href: `${base}/documents`, icon: FileText },
        {
          label: "Bài viết & thông báo",
          href: `${base}/posts`,
          icon: Newspaper,
        },
        {
          label: "Ngân hàng câu hỏi",
          href: `${base}/questions`,
          icon: BookOpen,
        },
        {
          label: "Nhập đề PDF",
          href: `${base}/questions/import`,
          icon: FileUp,
        },
      ],
    });
  }
  if (role === "ADMIN")
    groups.push({
      label: "Quản trị hệ thống",
      items: [
        { label: "Người dùng & quyền", href: "/admin/users", icon: Users },
        { label: "Vinh danh & thành tích", href: ROUTES.ADMIN_RECOGNITION, icon: Award },
        {
          label: "Môn học, danh mục & tag",
          href: "/admin/categories",
          icon: FolderTree,
        },
      ],
    });
  if (role)
    groups.push({
      label: "Cá nhân",
      items: [
        {
          label: role === "STUDENT" ? "Góc học tập" : "Tổng quan",
          href: getDashboardRoute(role),
          icon: LayoutDashboard,
        },
        { label: "Hồ sơ & bảo mật", href: ROUTES.PROFILE, icon: User },
        { label: "Daily của tôi", href: ROUTES.DAILY, icon: CalendarCheck },
        { label: "Nhóm Daily", href: ROUTES.DAILY_GROUPS, icon: Users },
        ...(role === "STUDENT" ? [{ label: "Thành tích của tôi", href: ROUTES.MY_ACHIEVEMENTS, icon: Award }] : []),
      ],
    });
  return groups;
}

export function getActiveNavigationItem(
  items: NavigationItem[],
  pathname: string,
  search = "",
): NavigationItem | undefined {
  const current = pathname.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(search);
  return items
    .filter((item) => {
      const [targetPath, targetSearch] = item.href.split("?");
      const matches = (path: string) =>
        current === path || (path !== "/" && current.startsWith(`${path}/`));
      if (item.aliases?.some(matches)) return true;
      if (!matches(targetPath)) return false;
      return [...new URLSearchParams(targetSearch)].every(
        ([key, value]) =>
          (params.get(key) ?? (key === "tool" ? "rooms" : null)) === value,
      );
    })
    .sort((a, b) => b.href.length - a.href.length)[0];
}
