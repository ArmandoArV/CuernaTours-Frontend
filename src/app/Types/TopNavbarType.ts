export type TopNavbarItem = {
  title: string;
  link?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  isDropdown?: boolean;
  dropdownItems?: TopNavbarItem[];
};

export interface TopNavbarProps {
  title?: string;
  logo?: string;
  items?: TopNavbarItem[];
  userInfo?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  onUserMenuClick?: () => void;
  onNotificationClick?: () => void;
  notificationCount?: number;
  className?: string;
}