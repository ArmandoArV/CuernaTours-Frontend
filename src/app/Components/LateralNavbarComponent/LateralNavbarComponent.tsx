import React from "react";
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
};

const LateralNavbarComponent: React.FC<Props> = ({
  items,
  userIsAdmin = false,
  userIsOwner = false,
  openLogo = "/Images/CuernaToursLogo.svg",
  closedLogo = "/Images/CuernaToursAsset1.svg",
}) => {
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
    <nav className={styles.lateralNavbar}>
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
            <Link href={item.link} className={styles.navLink}>
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
  );
};
export default LateralNavbarComponent;
