"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown20Regular } from "@fluentui/react-icons";
import { TopNavbarProps, TopNavbarItem } from "../../Types/TopNavbarType";
import styles from "./TopNavbar.module.css";

const TopNavbarComponent: React.FC<TopNavbarProps> = ({
  userInfo,
  onUserMenuClick,
  className = "",
}) => {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className={`${styles.topNavbar} ${className}`}>
      <div className={styles.leftSection}></div>

      <div className={styles.rightSection}>
        {userInfo && (
          <div className={styles.userSection} onClick={onUserMenuClick}>
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
        )}
      </div>
    </nav>
  );
};

export default TopNavbarComponent;
