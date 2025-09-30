"use client";
import React, { useState } from "react";
import styles from "./LateralNavbar.module.css";
import Link from "next/link";
import Image from "next/image";
import { LateralNavbarType } from "../../Types/LateralNavbarType";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileToggle = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    onMobileMenuToggle?.(newState);
  };
  // Filter items based on user role
  const filteredItems = items.filter((item) => {
    // If user is owner, they can see all items
    if (userIsOwner) {
      return true;
    }

    // If user is admin, they can see normal and admin items, but not owner-only items
    if (userIsAdmin) {
      return !item.isOwner;
    }

    // Normal users can only see items that are not admin or owner exclusive
    return !item.isAdmin && !item.isOwner;
  });

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        className={styles.mobileHamburger}
        onClick={handleMobileToggle}
        aria-label="Toggle mobile menu"
      >
        <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerLineOpen : ''}`}></span>
        <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerLineOpen : ''}`}></span>
        <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerLineOpen : ''}`}></span>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && <div className={styles.mobileOverlay} onClick={handleMobileToggle}></div>}

      {/* Navigation */}
      <nav className={`${styles.lateralNavbar} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
        {/* Logo Section */}
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

        {/* Navigation Items */}
        <ul className={styles.navList}>
          {filteredItems.map((item, index) => (
            <li key={index} className={styles.navItem}>
              <Link 
                href={item.link} 
                className={styles.navLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon && (
                  <span className={styles.icon}>
                    {item.icon}
                  </span>
                )}
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
