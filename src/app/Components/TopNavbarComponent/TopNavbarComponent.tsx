"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown20Regular, PersonRegular, ArrowExitFilled } from "@fluentui/react-icons";
import { TopNavbarProps, TopNavbarItem } from "../../Types/TopNavbarType";
import styles from "./TopNavbar.module.css";
import { getCookie, deleteCookie } from "@/app/Utils/CookieUtil";
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";

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

  const clearAllCookies = () => {
    // Clear all authentication-related cookies
    deleteCookie('user', { path: '/' });
    deleteCookie('accessToken', { path: '/' });
    deleteCookie('token', { path: '/' });
    deleteCookie('auth', { path: '/' });
    deleteCookie('session', { path: '/' });
    
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
          // Get the API URL from environment or use a default
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          
          // Get token for authentication
          const token = getCookie('accessToken') || getCookie('token');
          
          // Make API call to logout endpoint
          const response = await fetch(`${apiUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            // Clear cookies regardless of API response
            clearAllCookies();
            
            // Show success message using the API message
            showSuccessAlert(
              "Sesión Cerrada",
              data.message || "Has cerrado sesión exitosamente.",
              () => {
                // Navigate to home page after success message
                router.push('/');
              }
            );
          } else {
            // Handle logout API error but still clear local data
            console.error('Logout API failed, but clearing local session');
            
            // Clear all cookies anyway for security
            clearAllCookies();
            
            showSuccessAlert(
              "Sesión Cerrada",
              "Has cerrado sesión exitosamente.",
              () => {
                router.push('/');
              }
            );
          }
        } catch (error) {
          console.error('Logout error:', error);
          
          // Clear local session even if API call fails
          clearAllCookies();
          
          // Show error message but still redirect
          showErrorAlert(
            "Error de Conexión",
            "No se pudo conectar con el servidor, pero tu sesión local ha sido eliminada.",
            () => {
              router.push('/');
            }
          );
        }
      },
      () => {
        // Cancel function - do nothing
        console.log('Logout cancelled');
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
