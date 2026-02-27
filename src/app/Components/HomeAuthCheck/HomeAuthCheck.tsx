"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "@/app/Utils/CookieUtil";

export default function HomeAuthCheck() {
  const router = useRouter();

  useEffect(() => {
    const accessToken = getCookie("accessToken");

    if (accessToken) {
      router.replace("/dashboard");
    }
  }, []);

  return null;
}
