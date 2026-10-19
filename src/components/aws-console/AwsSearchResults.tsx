"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { AwsConsoleOverlay, type OverlayAnchor } from "@/components/aws-console/AwsConsoleOverlay";
import { AwsServiceIcon } from "@/components/aws-console/AwsServiceIcon";
import { getServiceDescription } from "@/constants/service-descriptions";

export interface AwsSearchResultItem {
  text: string;
  href: string;
  description?: string;
  category?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface AwsSearchResultsProps {
  open: boolean;
  onClose: () => void;
  anchor: OverlayAnchor | null;
  query: string;
  results: AwsSearchResultItem[];
  isFavorite: (href: string) => boolean;
  onToggleFavorite: (item: AwsSearchResultItem) => void;
  /** Shows every available service when the query is empty ("see all services"). */
  browseAll?: AwsSearchResultItem[];
  onInputChange: (value: string) => void;
  inputId: string;
}

function ServiceGlyph({ href }: { href: string }) {
  return <AwsServiceIcon href={href} />;
}

/**
 * AwsSearchResults — the AWS unified-search panel.
 *
 * AWS splits the panel into a left column of result *types* and a right column of
 * results grouped into sections, each with a "See all N results" link and rows of
 * icon + name + description + favorite star.
 *
 * This console only has real data for one result type (services), so the left
 * column lists that type with its count instead of inventing Features/Blogs/
 * Documentation/Marketplace entries that would return nothing.
 */
export function AwsSearchResults({
  open,
  onClose,
  anchor,
  query,
  results,
  isFavorite,
  onToggleFavorite,
  browseAll,
  onInputChange,
  inputId,
}: AwsSearchResultsProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const trimmedQuery = query.trim();

  const shown = useMemo(
    () => (trimmedQuery.length === 0 ? (browseAll ?? []) : results),
    [browseAll, results, trimmedQuery],
  );

  // Keep typing focus in the search field while the panel is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !inputRef.current) return;
      const panel = document.getElementById("aws-search-results");
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>('[data-overlay-item]:not([aria-disabled="true"])'),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  const go = (item: AwsSearchResultItem) => {
    if (item.disabled) return;
    router.push(item.href);
    onClose();
  };

  return (
    <AwsConsoleOverlay
      open={open}
      onClose={onClose}
      anchor={anchor}
      id="aws-search-results"
      width={760}
      className="aws-console-overlay-panel--search"
    >
      <div className="aws-search-results">
        <nav className="aws-search-results__types" aria-label="Search result types">
          <ul>
            <li>
              <button
                type="button"
                className="aws-search-results__type is-selected"
                aria-current="true"
              >
                Services ({shown.length})
              </button>
            </li>
          </ul>
        </nav>

        <div className="aws-search-results__body">
          <div className="aws-search-results__field">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path
                d="M7 1a6 6 0 104.24 10.24l3.26 3.26 1.06-1.06-3.26-3.26A6 6 0 007 1zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z"
                fill="currentColor"
              />
            </svg>
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Search for services, features, blogs, docs, and more"
              aria-label="Search services"
              autoComplete="off"
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  const first = document.querySelector<HTMLElement>(
                    "#aws-search-results [data-overlay-item]",
                  );
                  first?.focus();
                }
              }}
            />
          </div>

          <p className="aws-search-results__summary">
            {trimmedQuery.length > 0 ? `Search results for "${trimmedQuery}"` : "All services"}
          </p>

          {shown.length > 0 ? (
            <section className="aws-search-results__section">
              <header>
                <h3>Services</h3>
                {trimmedQuery.length > 0 && (
                  <button type="button" className="aws-search-results__see-all">
                    See all {shown.length} results
                  </button>
                )}
              </header>
              <ul className="aws-search-results__list">
                {shown.map((item) => {
                  const description = item.description || getServiceDescription(item.text);
                  const favorite = isFavorite(item.href);
                  return (
                    <li key={item.href} className={item.disabled ? "is-disabled" : undefined}>
                      <div className="aws-search-results__row">
                        <button
                          type="button"
                          data-overlay-item
                          className="aws-search-results__row-main"
                          disabled={item.disabled}
                          aria-disabled={item.disabled || undefined}
                          title={item.disabled ? item.disabledReason : undefined}
                          onClick={() => go(item)}
                        >
                          <ServiceGlyph href={item.href} />
                          <span className="aws-search-results__row-text">
                            <span className="aws-search-results__row-name">{item.text}</span>
                            {description ? (
                              <span className="aws-search-results__row-description">
                                {description}
                              </span>
                            ) : null}
                          </span>
                        </button>
                        <button
                          type="button"
                          data-overlay-item
                          className={`aws-search-results__star${favorite ? " is-favorite" : ""}`}
                          aria-label={`${favorite ? "Remove" : "Add"} ${item.text} ${favorite ? "from" : "to"} favorites`}
                          aria-pressed={favorite}
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
                              fill={favorite ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth="1.2"
                            />
                          </svg>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : (
            <p className="aws-search-results__empty">
              {trimmedQuery.length > 0
                ? "No services match your search. Services the active emulator cannot serve are not searchable."
                : "No services available."}
            </p>
          )}
        </div>
      </div>
    </AwsConsoleOverlay>
  );
}
