import { describe, expect, it } from "vite-plus/test";
import { getServiceNavigation, SERVICE_NAVIGATION } from "@/constants/service-navigation";

describe("getServiceNavigation", () => {
  it("keeps the EC2 information architecture on nested detail routes", () => {
    const navigation = getServiceNavigation("/ec2/i-1234567890");

    expect(navigation?.[0]?.text).toBe("EC2");
    expect(navigation?.[0]?.items.map((item) => item.text)).toEqual(
      expect.arrayContaining(["Instances", "Launch instances", "Images", "Key pairs"]),
    );
  });

  it("switches the contextual navigation for IAM routes", () => {
    const navigation = getServiceNavigation("/iam/policies");

    expect(navigation?.[0]?.text).toBe("IAM");
    expect(navigation?.[0]?.items.map((item) => item.text)).toEqual(
      expect.arrayContaining(["Users", "Roles", "Policies", "Groups"]),
    );
  });

  it("keeps contextual link destinations unique for active-state resolution", () => {
    for (const groups of Object.values(SERVICE_NAVIGATION)) {
      const links = groups.flatMap((group) => group.items.map((item) => item.href));
      expect(new Set(links).size).toBe(links.length);
    }
  });

  it("keeps IAM navigation on legacy sibling IAM routes", () => {
    const navigation = getServiceNavigation("/iam-access-key");

    expect(navigation?.[0]?.text).toBe("IAM");
    expect(navigation?.[0]?.items.map((item) => item.text)).toEqual(
      expect.arrayContaining(["Overview", "Access keys"]),
    );
  });

  it("uses the bespoke registry for a service that has one", () => {
    // SQS has exactly one route, so the rail is resolved from /sqs itself. A
    // nested path would prove nothing extra: getServiceNavigation keys on the
    // first segment, which the sibling /ec2 test above already covers.
    const navigation = getServiceNavigation("/sqs");

    expect(navigation?.[0]?.text).toBe("Amazon SQS");
    expect(navigation?.[0]?.items[0]).toEqual({ text: "Queues", href: "/sqs" });
    // Related services live in a second group, so the rail is checked as a whole.
    const labels = (navigation ?? []).flatMap((group) => group.items.map((item) => item.text));
    expect(labels).toEqual(expect.arrayContaining(["Queues", "SNS topics", "EventBridge"]));
  });

  it("keeps the alarm and table-detail rails pointing at the pages that serve them", () => {
    // Both services used to advertise an entry for a route whose body was a
    // single sentence, which made the rail a dead control. Alarms are the
    // default tab of /cloudwatch and table detail is /dynamodb/[tableName], so
    // the rails name only destinations that exist.
    const cloudwatch = getServiceNavigation("/cloudwatch");
    expect(cloudwatch?.[0]?.items.map((item) => item.href)).not.toContain("/cloudwatch/alarms");
    expect(cloudwatch?.[0]?.items.map((item) => item.href)).toContain("/cloudwatch");

    const dynamodb = getServiceNavigation("/dynamodb");
    expect(dynamodb?.[0]?.items.map((item) => item.href)).not.toContain("/dynamodb/tables");
    expect(dynamodb?.[0]?.items[0]).toEqual({ text: "Tables", href: "/dynamodb" });
  });

  it("derives a service-specific group for catalog services without a bespoke registry", () => {
    // /elasticache has no hand-written entry, so it must still get a usable rail
    // rather than nothing at all.
    const navigation = getServiceNavigation("/elasticache");

    expect(navigation?.[0]?.text).toBe("ElastiCache");
    expect(navigation?.[0]?.items[0]).toEqual({ text: "Overview", href: "/elasticache" });
    expect(navigation?.[0]?.items.map((item) => item.text)).toEqual(
      expect.arrayContaining(["Overview"]),
    );
  });

  it("leaves non-service utility routes on the global navigation", () => {
    expect(getServiceNavigation("/settings")).toBeUndefined();
    expect(getServiceNavigation("/")).toBeUndefined();
  });
});
