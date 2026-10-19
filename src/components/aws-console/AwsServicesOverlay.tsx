"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AwsConsoleOverlay, type OverlayAnchor } from "@/components/aws-console/AwsConsoleOverlay";
import { AwsServiceIcon } from "@/components/aws-console/AwsServiceIcon";
import { getServiceDescription } from "@/constants/service-descriptions";

export interface AwsServicesOverlayItem {
  text: string;
  href: string;
  disabled: boolean;
  disabledReason?: string;
}

export interface AwsServicesOverlayCategory {
  text: string;
  items: AwsServicesOverlayItem[];
}

export interface AwsServicesOverlayProps {
  open: boolean;
  onClose: () => void;
  anchor: OverlayAnchor | null;
  categories: AwsServicesOverlayCategory[];
  recentItems: AwsServicesOverlayItem[];
  favoriteItems: AwsServicesOverlayItem[];
  isFavorite: (href: string) => boolean;
  onToggleFavorite: (item: AwsServicesOverlayItem) => void;
}

function ServiceGlyph({ href, className }: { href: string; className?: string }) {
  return <AwsServiceIcon href={href} className={className} />;
}

/**
 * AwsServicesOverlay — the two-column "Services" panel from the AWS console.
 *
 * Left column: Recently visited, Favorites, then the service categories with the
 * selected category highlighted. Right column: the selected category's services
 * with their official AWS icon, name and description.
 *
 * Services the active emulator cannot serve stay visible but disabled, with the
 * capability reason exposed through `title` and `aria-disabled` so the console
 * never implies support it does not have.
 */
export function AwsServicesOverlay({
  open,
  onClose,
  anchor,
  categories,
  recentItems,
  favoriteItems,
  isFavorite,
  onToggleFavorite,
}: AwsServicesOverlayProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const firstCategory = useMemo(
    () =>
      categories.find((category) => category.items.some((item) => !item.disabled))?.text ??
      categories[0]?.text ??
      null,
    [categories],
  );

  // Reset to the first available category each time the panel opens.
  useEffect(() => {
    if (open) setSelected(firstCategory);
  }, [open, firstCategory]);

  const active = categories.find((category) => category.text === selected) ?? null;

  const go = (item: AwsServicesOverlayItem) => {
    if (item.disabled) return;
    router.push(item.href);
    onClose();
  };

  return (
    <AwsConsoleOverlay
      open={open}
      onClose={onClose}
      anchor={anchor}
      id="aws-services-overlay"
      width={720}
      className="aws-console-overlay-panel--services"
    >
      <div className="aws-services-overlay">
        <nav className="aws-services-overlay__categories" aria-label="Service categories">
          <section className="aws-services-overlay__group">
            <h2 className="aws-services-overlay__group-title">Recently visited</h2>
            {recentItems.length > 0 ? (
              <ul className="aws-services-overlay__plain-list">
                {recentItems.map((item) => (
                  <li key={`recent-${item.href}`}>
                    <button
                      type="button"
                      data-overlay-item
                      className="aws-services-overlay__plain-link"
                      disabled={item.disabled}
                      aria-disabled={item.disabled || undefined}
                      title={item.disabled ? item.disabledReason : undefined}
                      onClick={() => go(item)}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="aws-services-overlay__empty">No recently visited services</p>
            )}
          </section>

          <section className="aws-services-overlay__group">
            <h2 className="aws-services-overlay__group-title">Favorites</h2>
            {favoriteItems.length > 0 ? (
              <ul className="aws-services-overlay__plain-list">
                {favoriteItems.map((item) => (
                  <li key={`favorite-${item.href}`}>
                    <button
                      type="button"
                      data-overlay-item
                      className="aws-services-overlay__plain-link"
                      disabled={item.disabled}
                      aria-disabled={item.disabled || undefined}
                      title={item.disabled ? item.disabledReason : undefined}
                      onClick={() => go(item)}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="aws-services-overlay__empty">No favorite services</p>
            )}
          </section>

          <hr className="aws-services-overlay__divider" />

          <section className="aws-services-overlay__group">
            <h2 className="aws-services-overlay__group-title">All services</h2>
            <ul className="aws-services-overlay__category-list">
              {categories.map((category) => {
                const categoryIcon =
                  category.items.find((item) => !item.disabled)?.href ??
                  category.items[0]?.href ??
                  "";
                const isSelected = category.text === active?.text;
                return (
                  <li key={category.text}>
                    <button
                      type="button"
                      data-overlay-item
                      className={`aws-services-overlay__category${isSelected ? " is-selected" : ""}`}
                      aria-current={isSelected ? "true" : undefined}
                      onClick={() => setSelected(category.text)}
                    >
                      <ServiceGlyph href={categoryIcon} />
                      <span>{category.text}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </nav>

        <div className="aws-services-overlay__detail">
          {active ? (
            <>
              <header className="aws-services-overlay__detail-header">
                <ServiceGlyph href={active.items[0]?.href ?? ""} />
                <h2>{active.text}</h2>
                <button
                  type="button"
                  className="aws-services-overlay__close"
                  aria-label="Close services"
                  onClick={onClose}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M1 1l12 12M13 1L1 13"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      fill="none"
                    />
                  </svg>
                </button>
              </header>
              <ul className="aws-services-overlay__service-list">
                {active.items.map((item) => (
                  <li key={item.href}>
                    <div
                      className={`aws-services-overlay__service${item.disabled ? " is-disabled" : ""}`}
                    >
                      <button
                        type="button"
                        data-overlay-item
                        className="aws-services-overlay__service-main"
                        disabled={item.disabled}
                        aria-disabled={item.disabled || undefined}
                        title={item.disabled ? item.disabledReason : undefined}
                        onClick={() => go(item)}
                      >
                        <ServiceGlyph href={item.href} />
                        <span className="aws-services-overlay__service-text">
                          <span className="aws-services-overlay__service-name">{item.text}</span>
                          {getServiceDescription(item.text) ? (
                            <span className="aws-services-overlay__service-description">
                              {getServiceDescription(item.text)}
                            </span>
                          ) : null}
                        </span>
                      </button>
                      <button
                        type="button"
                        data-overlay-item
                        className={`aws-services-overlay__star${isFavorite(item.href) ? " is-favorite" : ""}`}
                        aria-label={`${isFavorite(item.href) ? "Remove" : "Add"} ${item.text} ${isFavorite(item.href) ? "from" : "to"} favorites`}
                        aria-pressed={isFavorite(item.href)}
                        onClick={() => onToggleFavorite(item)}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path
                            d="M8 1.6l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.4l-3.8 2 .7-4.3-3.1-3 4.3-.6z"
                            fill={isFavorite(item.href) ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="1.2"
                          />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="aws-services-overlay__empty">No services available.</p>
          )}
        </div>
      </div>
    </AwsConsoleOverlay>
  );
}

/** Categories that have at least one service, used to keep the panel meaningful. */
export function hasRenderableCategory(categories: AwsServicesOverlayCategory[]): boolean {
  return categories.length > 0;
}
