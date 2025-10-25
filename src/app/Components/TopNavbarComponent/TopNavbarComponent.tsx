"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown20Regular, PersonRegular, ArrowExitFilled } from "@fluentui/react-icons";
import { TopNavbarProps, TopNavbarItem } from "../../Types/TopNavbarType";
import styles from "./TopNavbar.module.css";
import { getCookie, deleteCookie } from "@/app/Utils/CookieUtil";

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
        const userCookie = getCookie('user');
        if (userCookie) {
          const userData = JSON.parse(userCookie);
          setUserInfo({
            name: userData.display_name || `${userData.name || ''} ${userData.lastname || ''}`.trim(),
            role: userData.role?.name || userData.role || 'Usuario',
            avatar: userData.avatar || null,
            email: userData.email || '',
          });
        }
      } catch (error) {
        console.error('Error parsing user data from cookie:', error);
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
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
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
    router.push('/profile');
  };

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    
    // Clear all authentication-related cookies
    deleteCookie('user', { path: '/' });
    deleteCookie('token', { path: '/' });
    deleteCookie('auth', { path: '/' });
    deleteCookie('session', { path: '/' });
    
    // Clear user info state
    setUserInfo(null);
    
    // Navigate to home page using Next.js router
    router.push('/');
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
                <div className={styles.dropdownItem} onClick={handleProfileClick}>
                  <PersonRegular className={styles.dropdownIcon} />
                  Perfil
                </div>
                <div className={styles.dropdownItem} onClick={handleLogoutClick}>
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
