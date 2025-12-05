"use client";
import { OrderProvider } from "@/app/Contexts/OrderContext";

export default function EditOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrderProvider>
      {children}
    </OrderProvider>
  );
}
