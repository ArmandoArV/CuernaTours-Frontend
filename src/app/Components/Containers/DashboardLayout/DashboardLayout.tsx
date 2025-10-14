"use client";
import React from "react";
import { LateralNavbarType } from "../../../Types/LateralNavbarType";
import LateralNavbarComponent from "../../LateralNavbarComponent/LateralNavbarComponent";
import TopNavbarComponent from "../../TopNavbarComponent/TopNavbarComponent";
import { HomeFilled } from "@fluentui/react-icons";
import styles from "./DashboardLayout.module.css";
export interface DashboardLayoutProps {
  children: React.ReactNode;
  userIsAdmin?: boolean;
  userIsOwner?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userIsAdmin = false,
  userIsOwner = false,
}) => {
  const lateralNavItems: LateralNavbarType[] = [
    { title: "Home", link: "/", icon: <HomeFilled /> }, // Visible to all
    { title: "Profile", link: "/profile" }, // Visible to all
    { title: "Admin Panel", link: "/admin", isAdmin: true }, // Only admin and owner
    { title: "User Management", link: "/users", isAdmin: true }, // Only admin and owner
    { title: "System Settings", link: "/settings", isOwner: true }, // Only owner
  ];

  const handleNotificationClick = () => {
    console.log("Notifications clicked");
  };

  const handleUserMenuClick = () => {
    console.log("User menu clicked");
  };

  return (
    <div className={styles.dashboardLayout}>
      <TopNavbarComponent
        title="CuernaTours"
        userInfo={{
          name: "John Doe",
          role: userIsOwner
            ? "Propietario"
            : userIsAdmin
            ? "Administrador"
            : "Usuario",
        }}
        onNotificationClick={handleNotificationClick}
        onUserMenuClick={handleUserMenuClick}
        notificationCount={3}
      />
      <LateralNavbarComponent
        items={lateralNavItems}
        userIsAdmin={userIsAdmin}
        userIsOwner={userIsOwner}
      />
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
