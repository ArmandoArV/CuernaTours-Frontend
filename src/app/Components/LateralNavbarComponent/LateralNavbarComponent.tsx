"use client";
import React, { useState, useEffect } from "react";
import styles from "./LateralNavbar.module.css";
import Link from "next/link";
import Image from "next/image";
import { LateralNavbarType } from "../../Types/LateralNavbarType";
import { Button } from "@fluentui/react-components";
import { NavigationRegular, DismissRegular } from "@fluentui/react-icons";
import { useIsMobile } from "@/app/hooks/useIsMobile";

type Props = {
  items: LateralNavbarType[];
  userIsAdmin?: boolean;
  userIsOwner?: boolean;
  openLogo?: string;
  closedLogo?: string;
  onMobileMenuToggle?: (isOpen: boolean) => void;
};

const LateralNavbarComponent: React.FC<Props> = ({
  items,
  userIsAdmin = false,
  userIsOwner = false,
  openLogo = "/Images/CuernaToursLogo.svg",
  closedLogo = "/Images/CuernaToursAsset3.svg",
  onMobileMenuToggle,
}) => {
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close menu automatically when resizing to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  const handleMobileToggle = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    onMobileMenuToggle?.(newState);
  };

  const filteredItems = items.filter((item) => {
    if (userIsOwner) return true;
    if (userIsAdmin) return !item.isOwner;
    return !item.isAdmin && !item.isOwner;
  });

  return (
    <>
      {/* FluentUI Mobile Toggle */}
      {isMobile && (
        <Button
          appearance="subtle"
          icon={isMobileMenuOpen ? <DismissRegular /> : <NavigationRegular />}
          onClick={handleMobileToggle}
          className={`${styles.mobileToggleButton} ${
            isMobileMenuOpen ? styles.mobileOpenIcon : styles.mobileClosedIcon
          }`}
        />
      )}

      {/* Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={handleMobileToggle} />
      )}

      <nav
        className={`${styles.lateralNavbar} ${
          isMobile && isMobileMenuOpen ? styles.mobileOpen : ""
        }`}
      >
        {/* Logo */}
        <div className={styles.logoSection}>
          <Image
            src={closedLogo}
            alt="Cuerna Tours Logo"
            width={40}
            height={40}
            className={styles.logoDefault}
          />
          <Image
            src={openLogo}
            alt="Cuerna Tours Logo"
            width={150}
            height={60}
            className={styles.logoExpanded}
          />
        </div>

        {/* Items */}
        <ul className={styles.navList}>
          {filteredItems.map((item, index) => (
            <li key={index} className={styles.navItem}>
              <Link
                href={item.link}
                className={styles.navLink}
                onClick={() => {
                  if (isMobile) {
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.title}>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default LateralNavbarComponent;
