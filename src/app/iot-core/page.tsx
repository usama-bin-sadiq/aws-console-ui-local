"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function IoTCorePage() {
  const router = useRouter();
  useEffect(() => { router.replace("/iot"); }, [router]);
  return null;
}
