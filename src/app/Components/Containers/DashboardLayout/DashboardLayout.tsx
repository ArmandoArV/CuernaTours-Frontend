"use client";
import React from "react";
import { LateralNavbarType } from "../../../Types/LateralNavbarType";
import LateralNavbarComponent from "../../LateralNavbarComponent/LateralNavbarComponent";
import TopNavbarComponent from "../../TopNavbarComponent/TopNavbarComponent";
import {
  HomeFilled,
  HistoryFilled,
  PeopleFilled,
  MoneyFilled,
  GasPumpFilled,
} from "@fluentui/react-icons";
import styles from "./DashboardLayout.module.css";

export interface DashboardLayoutProps{
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
    { title: "Inicio", link: "/dashboard", icon: <HomeFilled /> },
    { title: "Historial", link: "/dashboard/historical", icon: <HistoryFilled /> },
    { title: "Gastos", link: "/gastos", icon: <MoneyFilled /> },
    { title: "Vales", link: "/dashboard/vales", icon: <GasPumpFilled /> },
    { title: "Usuarios", link: "/users", icon: <PeopleFilled />, isAdmin: true },
  ];

  return (
    <div className={styles.dashboardLayout}>
      <TopNavbarComponent />
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
