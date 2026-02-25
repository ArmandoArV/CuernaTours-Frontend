"use client";
import React from "react";
import { LateralNavbarType } from "../../../Types/LateralNavbarType";
import LateralNavbarComponent from "../../LateralNavbarComponent/LateralNavbarComponent";
import TopNavbarComponent from "../../TopNavbarComponent/TopNavbarComponent";
import {
  HomeFilled,
  HistoryFilled,
  PersonCircleFilled,
  PersonAccountsFilled,
  SettingsFilled,
  AppsListFilled
} from "@fluentui/react-icons";
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
    { title: "Inicio", link: "/dashboard", icon: <HomeFilled /> }, // Visible to all
    {
      title: "Historial",
      link: "/dashboard/historical",
      icon: <HistoryFilled />,
    }, // Visible to all
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
