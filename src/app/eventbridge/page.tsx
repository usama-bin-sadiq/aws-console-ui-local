"use client";
import React from "react";
import { useUniversalCRUD } from "@/lib/universal-crud";
import { ResponsiveServiceLayout } from "@/components/service-layout/ResponsiveServiceLayout";
export default function Page() {
  const crud = useUniversalCRUD({ serviceName: "EventBridge", resourceType: "Resource" });
  return (<ResponsiveServiceLayout serviceName="EventBridge" serviceRoute="eventbridge" adapterStatus="connected" content={
    <div><h3>EventBridge</h3><p>Full adapter support enabled.</p></div>
  } />);
}
