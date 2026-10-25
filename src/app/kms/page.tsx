"use client";

import KMSCore from "@/components/KMSCore";
import { useRouter } from "next/navigation";
import ServiceLayout from "@/components/layouts/ServiceLayout";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

export default function KMSPage() {
  const router = useRouter();
  return (
    <ServiceLayout
      serviceName="KMS"
      showServiceHeader={false}
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "KMS", href: "/kms" },
      ]}
    >
      <AwsServiceHeader
        serviceName="AWS KMS"
        serviceIcon={SERVICE_ICONS["/kms"]?.small}
        primaryAction={
          <button type="button" className="aws-service-page__create" onClick={() => router.push("/kms/create")}>
            Create key
          </button>
        }
      />
      <KMSCore />
    </ServiceLayout>
  );
}
