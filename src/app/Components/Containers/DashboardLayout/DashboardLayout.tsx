"use client";
import React from "react";
import { LateralNavbarType } from "../../../Types/LateralNavbarType";
import LateralNavbarComponent from "../../LateralNavbarComponent/LateralNavbarComponent";
import { HomeFilled } from "@fluentui/react-icons";
import styles from "./DashboardLayout.module.css";
import TopNavbarComponent from "../../TopNavbarComponent/TopNavbarComponent";
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
  const navItems: LateralNavbarType[] = [
    { title: "Home", link: "/", icon: <HomeFilled /> }, // Visible to all
    { title: "Profile", link: "/profile" }, // Visible to all
    { title: "Admin Panel", link: "/admin", isAdmin: true }, // Only admin and owner
    { title: "User Management", link: "/users", isAdmin: true }, // Only admin and owner
    { title: "System Settings", link: "/settings", isOwner: true }, // Only owner
  ];

  return (
    <div className={styles.dashboardLayout}>
      <TopNavbarComponent
        title="CuernaTours Admin"
        items={[
          { title: "Dashboard", link: "/dashboard", icon: <HomeFilled /> },
          {
            title: "Tours",
            isDropdown: true,
            dropdownItems: [
              { title: "All Tours", link: "/tours" },
              { title: "Create Tour", link: "/tours/create" },
            ],
          },
        ]}
        userInfo={{
          name: "John Doe",
          role: "Administrator",
        }}
        onNotificationClick={() => console.log("Notifications")}
        notificationCount={5}
      />
      <LateralNavbarComponent
        items={navItems}
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
