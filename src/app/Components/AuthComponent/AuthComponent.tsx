"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "@/app/Utils/CookieUtil";

type AuthRouteProps = {
  children: React.ReactNode;
};

export default function AuthComponent({ children }: AuthRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  useEffect(() => {
    const checkAuth = () => {
      const accessToken = getCookie("accessToken");
      if (accessToken) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push("/");
      }
    };
    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
