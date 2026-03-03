"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronDown20Regular,
  PersonRegular,
  ArrowExitFilled,
} from "@fluentui/react-icons";
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
} from "@fluentui/react-components";
import styles from "./TopNavbar.module.css";
import { getCookie, deleteCookie } from "@/app/Utils/CookieUtil";
import { formatPersonName } from "@/app/Utils/FormatUtil";
import { showConfirmAlert } from "@/app/Utils/AlertUtil";
import { authService } from "@/services/api";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("TopNavbarComponent");

interface TopNavbarComponentProps {
  className?: string;
}

const TopNavbarComponent: React.FC<TopNavbarComponentProps> = ({
  className = "",
}) => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    try {
      const userCookie = getCookie("user");
      if (userCookie) {
        const userData = JSON.parse(userCookie);

        const displayName =
          userData.display_name ||
          `${userData.name || ""} ${userData.first_lastname || userData.lastname || ""}`.trim() ||
          userData.username ||
          userData.email?.split("@")[0] ||
          "Usuario";

        const formattedName = formatPersonName(displayName);

        const getRoleName = (roleId: number) => {
          const roleMap: { [key: number]: string } = {
            1: "Maestro",
            2: "Administrador",
            3: "Chofer",
            4: "Oficina",
          };
          return roleMap[roleId] || "Usuario";
        };

        const userRole =
          userData.role?.name ||
          userData.role ||
          (userData.role_id
            ? getRoleName(userData.role_id)
            : userData.roleId
              ? getRoleName(userData.roleId)
              : "Usuario");

        setUserInfo({
          name: formattedName,
          role: userRole,
          avatar: userData.picture_url || userData.avatar || null,
        });
      }
    } catch (error) {
      log.error("Error parsing user data from cookie:", error);
    }
  }, []);

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  const clearAllCookies = () => {
    deleteCookie("user", { path: "/" });
    deleteCookie("accessToken", { path: "/" });
    deleteCookie("token", { path: "/" });
    deleteCookie("auth", { path: "/" });
    deleteCookie("session", { path: "/" });
    setUserInfo(null);
  };

  const handleLogoutClick = () => {
    showConfirmAlert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      "Sí, cerrar sesión",
      async () => {
        try {
          await authService.logout();
        } catch (error) {
          log.error("Backend logout error:", error);
        }
        clearAllCookies();
        router.replace("/");
        setTimeout(() => {
          window.location.reload();
        }, 50);
      },
    );
  };

  return (
    <nav className={`${styles.topNavbar} ${className}`}>
      <div className={styles.leftSection}></div>

      <div className={styles.rightSection}>
        {userInfo && (
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <div className={styles.userSection}>
                <div className={styles.userAvatar}>
                  {userInfo.avatar ? (
                    <Image
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      width={32}
                      height={32}
                      className={styles.avatarImage}
                    />
                  ) : (
                    getUserInitials(userInfo.name)
                  )}
                </div>
                <div className={styles.userInfo}>
                  <p className={styles.userName}>{userInfo.name}</p>
                  {userInfo.role && (
                    <p className={styles.userRole}>{userInfo.role}</p>
                  )}
                </div>
                <ChevronDown20Regular />
              </div>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<PersonRegular />}
                  onClick={handleProfileClick}
                >
                  Mi Perfil
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<ArrowExitFilled />}
                  onClick={handleLogoutClick}
                >
                  Cerrar Sesión
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        )}
      </div>
    </nav>
  );
};

export default TopNavbarComponent;
