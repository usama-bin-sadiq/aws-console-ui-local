import { describe, expect, it } from "vite-plus/test";
import {
  addFavoriteAsync,
  addRecentlyVisitedAsync,
  addTerminalHistoryAsync,
  createUserAsync,
  deleteUserAsync,
  getFavoritesAsync,
  getRecentlyVisitedAsync,
  getTerminalHistoryAsync,
  getUserByEmailAsync,
  getUserByIdAsync,
  getUserPermissionsAsync,
  getWidgetConfigAsync,
  removeFavoriteAsync,
  updateUserLastLoginAsync,
  updateUserMFAAsync,
  updateUserPasswordAsync,
  updateWidgetConfigAsync,
  validateUserAsync,
} from "@/lib/db";

describe("database supporting records", () => {
  it("supports user lookup, updates, permissions, and deletion", async () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const username = `extended_${suffix}`;
    const user = await createUserAsync({
      username,
      password: "old-password",
      email: `${username}@example.com`,
      permissions: ["s3:read"],
    });

    expect((await getUserByEmailAsync(user.email))?.username).toBe(username);
    expect((await getUserByIdAsync(user.id))?.username).toBe(username);
    expect(await getUserPermissionsAsync(username)).toEqual(["s3:read"]);

    await updateUserLastLoginAsync(username);
    await updateUserMFAAsync(username, true, "secret");
    await updateUserPasswordAsync(username, "new-password");
    expect(await validateUserAsync(username, "new-password")).toBeDefined();
    expect(await validateUserAsync(username, "old-password")).toBeUndefined();
    expect(await deleteUserAsync(username)).toBe(true);
  });

  it("supports widget, favorite, recently visited, and terminal records", async () => {
    const userId = `records_${Date.now()}`;
    await updateWidgetConfigAsync(userId, "missing-widget", { position_x: 2 });
    expect(Array.isArray(await getWidgetConfigAsync(userId))).toBe(true);

    await addFavoriteAsync(userId, "s3", "Amazon S3", "/s3");
    expect((await getFavoritesAsync(userId))[0]?.service_id).toBe("s3");
    await removeFavoriteAsync(userId, "s3");
    expect(await getFavoritesAsync(userId)).toHaveLength(0);

    await addRecentlyVisitedAsync(userId, "ec2", "Amazon EC2", "/ec2");
    expect((await getRecentlyVisitedAsync(userId))[0]?.service_id).toBe("ec2");

    await addTerminalHistoryAsync(userId, "aws s3 ls", "bucket", 0);
    expect((await getTerminalHistoryAsync(userId))[0]?.command).toBe("aws s3 ls");
  });
});
