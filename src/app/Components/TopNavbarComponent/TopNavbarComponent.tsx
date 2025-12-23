"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronDown20Regular,
  PersonRegular,
  ArrowExitFilled,
} from "@fluentui/react-icons";
import { TopNavbarProps, TopNavbarItem } from "../../Types/TopNavbarType";
import styles from "./TopNavbar.module.css";
import { getCookie, deleteCookie } from "@/app/Utils/CookieUtil";
import {
  showConfirmAlert,
  showSuccessAlert,
  showErrorAlert,
} from "@/app/Utils/AlertUtil";
import { authService } from "@/services/api";

const TopNavbarComponent: React.FC<TopNavbarProps> = ({
  userInfo: propsUserInfo,
  onUserMenuClick,
  className = "",
}) => {
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(propsUserInfo);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Load user information from cookies
  useEffect(() => {
    const loadUserInfo = () => {
      try {
        const userCookie = getCookie("user");
        if (userCookie) {
          const userData = JSON.parse(userCookie);

          // Use display_name as the primary name source
          const displayName =
            userData.display_name ||
            `${userData.name || ""} ${userData.first_lastname || userData.lastname || ""}`.trim() ||
            userData.username ||
            userData.email?.split("@")[0] ||
            "Usuario";

          // Map role based on roleId or existing role data
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
            (userData.role_id ? getRoleName(userData.role_id) : 
             userData.roleId ? getRoleName(userData.roleId) : "Usuario");

          setUserInfo({
            name: displayName,
            role: userRole,
            avatar: userData.picture_url || userData.avatar || null,
            email: userData.email || "",
            userId: userData.user_id || userData.userId,
            roleId: userData.role_id || userData.roleId,
            username: userData.username,
          });

          console.log("User info set in state:", {
            name: displayName,
            role: userRole,
            avatar: userData.picture_url || userData.avatar || null,
          });
        }
      } catch (error) {
        console.error("Error parsing user data from cookie:", error);
        // Fallback to props if cookie parsing fails
        if (propsUserInfo) {
          setUserInfo(propsUserInfo);
        }
      }
    };

    loadUserInfo();
  }, [propsUserInfo]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown !== null) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (
          dropdownElement &&
          !dropdownElement.contains(event.target as Node)
        ) {
          setOpenDropdown(null);
        }
      }

      // Close user menu when clicking outside
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown, isUserMenuOpen]);

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleUserMenuClick = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    if (onUserMenuClick) {
      onUserMenuClick();
    }
  };

  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    // Navigate to profile page using Next.js router
    router.push("/profile");
  };

  const clearAllCookies = () => {
    // Clear all authentication-related cookies
    deleteCookie("user", { path: "/" });
    deleteCookie("accessToken", { path: "/" });
    deleteCookie("token", { path: "/" });
    deleteCookie("auth", { path: "/" });
    deleteCookie("session", { path: "/" });

    // Clear user info state
    setUserInfo(null);
  };

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);

    // Show confirmation dialog
    showConfirmAlert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      "Sí, cerrar sesión",
      async () => {
        try {
          await authService.logout();

          // Show success message
          showSuccessAlert(
            "Sesión Cerrada",
            "Has cerrado sesión exitosamente.",
            () => {
              // Navigate to home page after success message
              router.push("/");
            }
          );
        } catch (error) {
          console.error("Logout error:", error);

          // Show success message anyway since local session is cleared
          showSuccessAlert(
            "Sesión Cerrada",
            "Has cerrado sesión exitosamente.",
            () => {
              router.push("/");
            }
          );
        }
      },
      () => {
        // Cancel function - do nothing
        console.log("Logout cancelled");
      }
    );
  };

  return (
    <nav className={`${styles.topNavbar} ${className}`}>
      <div className={styles.leftSection}></div>

      <div className={styles.rightSection}>
        {userInfo && (
          <div className={styles.userMenuContainer} ref={userMenuRef}>
            <div className={styles.userSection} onClick={handleUserMenuClick}>
              <div className={styles.userAvatar}>
                {userInfo.avatar ? (
                  <Image
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    width={32}
                    height={32}
                    className={styles.userAvatar}
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

            {isUserMenuOpen && (
              <div className={styles.userDropdown}>
                <div
                  className={styles.dropdownItem}
                  onClick={handleProfileClick}
                >
                  <PersonRegular className={styles.dropdownIcon} />
                  Perfil
                </div>
                <div
                  className={styles.dropdownItem}
                  onClick={handleLogoutClick}
                >
                  <ArrowExitFilled className={styles.dropdownIcon} />
                  Cerrar Sesión
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default TopNavbarComponent;
