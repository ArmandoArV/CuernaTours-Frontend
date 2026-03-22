"use client";
import React from "react";
import { LateralNavbarType } from "../../../Types/LateralNavbarType";
import LateralNavbarComponent from "../../LateralNavbarComponent/LateralNavbarComponent";
import TopNavbarComponent from "../../TopNavbarComponent/TopNavbarComponent";
import {
  CartFilled,
  HistoryFilled,
  PersonCircleFilled,
  MoneyFilled,
  ReceiptMoneyFilled
} from "@fluentui/react-icons";
import styles from "../DashboardLayout/DashboardLayout.module.css";

export interface DriverDashboardLayoutProps{
  children: React.ReactNode;
}

const DriverDashboardLayout: React.FC<DriverDashboardLayoutProps> = ({
  children,
}) => {
  const lateralNavItems: LateralNavbarType[] = [
    { title: "Mis Viajes", link: "/chofer/dashboard", icon: <CartFilled /> },
    { title: "Histórico", link: "/chofer/historico", icon: <HistoryFilled /> },
    { title: "Gastos", link: "/chofer/gastos", icon: <MoneyFilled /> },
    { title: "Vales", link: "/chofer/vales", icon: <ReceiptMoneyFilled /> },
    { title: "Perfil", link: "/profile", icon: <PersonCircleFilled /> },
  ];

  return (
    <div className={styles.dashboardLayout}>
      <TopNavbarComponent />
      <LateralNavbarComponent
        items={lateralNavItems}
        userIsAdmin={false}
        userIsOwner={false}
      />
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>{children}</div>
      </main>
    </div>
  );
};

export default DriverDashboardLayout;
