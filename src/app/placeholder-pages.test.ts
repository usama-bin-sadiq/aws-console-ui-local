import { existsSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "vite-plus/test";
import { SERVICE_NAVIGATION } from "@/constants/service-navigation";

/**
 * No service page is a dead end.
 *
 * Five routes served a body that was one sentence of prose — "SNS topics +
 * policies (L1.1) verified." and four like it — and two of them, DynamoDB
 * "Table details" and CloudWatch "Alarms", were linked from the left rail, so
 * clicking the console's own navigation landed on a page with nothing in it.
 * The service capability audit caught none of them, because it searched the
 * source for the words "coming soon" and the titles were perfectly honest.
 * That audit now measures the body instead, and reports every page whose whole
 * body is a short run of text with no state, no fetch and no widget.
 *
 * All five routes were removed rather than implemented, because the parent
 * service page already serves the content in every case. Removing a stub is
 * only half the fix: the route has to be gone, no rail entry may still point at
 * it, and the page that absorbed its content has to actually render something.
 * These are the five routes and the page that now serves each.
 *
 * The whole-app sweep stays in `pnpm audit:services`, which reports new
 * placeholder pages whoever owns them; asserting it here as well would pin this
 * test to pages outside this change.
 */

const APP_DIR = join(process.cwd(), "src", "app");

const ABSORBED_BY: readonly { route: string; serves: string }[] = [
  // /sns is the topics page: list, subscriptions, create, publish, delete.
  { route: "sns/topics", serves: "sns" },
  // /sqs is the queues page: send, batch, receive, purge, delete.
  { route: "sqs/queues", serves: "sqs" },
  // /dynamodb is the table list and /dynamodb/[tableName] the table detail.
  { route: "dynamodb/tables", serves: "dynamodb" },
  // /cloudwatch has Alarms as its default tab, with the whole alarm table.
  { route: "cloudwatch/alarms", serves: "cloudwatch" },
  // /ec2/[instanceId] is the instance detail page, for any real instance.
  { route: "ec2/detail", serves: "ec2/[instanceId]" },
];

/** Components and hooks that make a page something a user can operate. */
const CONTENT_SIGNALS =
  /\b(useState|useEffect|useReducer|useSWR|useQuery|apiFetch|getServerSideProps)\b|<(Table|Container|Box|Header|ColumnLayout|SpaceBetween|Alert|SplitPanel|PropertyEditor|ResourceTable|Tabs|TextFilter|FormField|Select|Input|Button|Modal)\b/;

const absorbedPages = ABSORBED_BY.map(({ serves }) => join(APP_DIR, serves, "page.tsx"));

describe("no service page is a dead end", () => {
  it("has the absorbing pages to check", () => {
    expect(absorbedPages).toHaveLength(ABSORBED_BY.length);
    for (const file of absorbedPages) {
      expect(existsSync(file), file).toBe(true);
    }
  });

  it.each(ABSORBED_BY)("has no page for the removed /$route", ({ route, serves }) => {
    expect(
      existsSync(join(APP_DIR, route, "page.tsx")),
      `/${route} was removed; /${serves} serves it`,
    ).toBe(false);
  });

  it.each(ABSORBED_BY)("leaves nothing behind at /$route", ({ route }) => {
    expect(existsSync(join(APP_DIR, route)), `/${route} is gone entirely`).toBe(false);
  });

  it.each(ABSORBED_BY)("advertises /$route nowhere in the left rail", ({ route }) => {
    const hrefs = Object.values(SERVICE_NAVIGATION).flatMap((groups) =>
      groups.flatMap((group) => group.items.map((item) => item.href)),
    );
    expect(hrefs, `/${route} was removed and must not be advertised`).not.toContain(`/${route}`);
  });

  it("gives the page that absorbed each dead end real content", () => {
    const thin = absorbedPages
      .filter((file) => !CONTENT_SIGNALS.test(readFileSync(file, "utf8")))
      .map((file) => relative(process.cwd(), file).split(sep).join("/"));
    expect(thin, "the page that replaced a dead end must actually render something").toEqual([]);
  });
});
