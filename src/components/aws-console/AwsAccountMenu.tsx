"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AwsConsoleOverlay, type OverlayAnchor } from "@/components/aws-console/AwsConsoleOverlay";

export interface AwsAccountMenuProps {
  open: boolean;
  onClose: () => void;
  anchor: OverlayAnchor | null;
  username: string;
  isSuperAdmin: boolean;
  providerLabel: string;
  onSignOut: () => void;
}

interface AccountMenuItem {
  id: string;
  label: string;
  href?: string;
  external?: boolean;
}

/**
 * AwsAccountMenu — the AWS account menu: identity rows (account id / IAM user)
 * with copy affordances, then navigation links, then a Sign out button.
 *
 * The AWS console shows a real account id here. This console has no AWS account,
 * so the identity rows show the emulator account label and the signed-in user
 * instead of inventing an account id.
 */
export function AwsAccountMenu({
  open,
  onClose,
  anchor,
  username,
  isSuperAdmin,
  providerLabel,
  onSignOut,
}: AwsAccountMenuProps) {
  const router = useRouter();

  const items: AccountMenuItem[] = [
    { id: "settings", label: "Settings", href: "/settings" },
    { id: "health", label: "Emulator health", href: "/health" },
    { id: "support", label: "Support Center", href: "/support" },
    {
      id: "docs",
      label: "AWS documentation",
      href: "https://docs.aws.amazon.com/",
      external: true,
    },
  ];

  return (
    <AwsConsoleOverlay
      open={open}
      onClose={onClose}
      anchor={anchor}
      id="aws-account-menu"
      width={300}
      align="end"
      className="aws-console-overlay-panel--account"
    >
      <div className="aws-account-menu">
        <dl className="aws-account-menu__identity">
          <div className="aws-account-menu__identity-row">
            <dt>Account</dt>
            <dd>emulator</dd>
          </div>
          <div className="aws-account-menu__identity-row">
            <dt>IAM user</dt>
            <dd>{username}</dd>
          </div>
          <div className="aws-account-menu__identity-row">
            <dt>Role</dt>
            <dd>{isSuperAdmin ? "Root/Super Admin" : "IAM User"}</dd>
          </div>
          <div className="aws-account-menu__identity-row">
            <dt>Emulator</dt>
            <dd>{providerLabel}</dd>
          </div>
        </dl>

        <hr className="aws-account-menu__divider" />

        <ul className="aws-account-menu__items">
          {items.map((item) => (
            <li key={item.id}>
              {item.external ? (
                <a
                  className="aws-account-menu__item"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-overlay-item
                >
                  {item.label}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M6 2h8v8h-2V5.41l-6.3 6.3-1.4-1.42L10.59 4H6V2z" fill="currentColor" />
                  </svg>
                </a>
              ) : (
                <button
                  type="button"
                  className="aws-account-menu__item"
                  data-overlay-item
                  onClick={() => {
                    router.push(item.href!);
                    onClose();
                  }}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>

        <hr className="aws-account-menu__divider" />

        <button
          type="button"
          className="aws-account-menu__signout"
          data-overlay-item
          onClick={() => {
            onClose();
            onSignOut();
          }}
        >
          Sign out
        </button>
      </div>
    </AwsConsoleOverlay>
  );
}
