"use client";

import React, { useState, useCallback, useMemo } from "react";
import CodeEditor, { CodeEditorProps } from "@cloudscape-design/components/code-editor";

type Props = {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: number;
  ariaLabel?: string;
};

function detectLanguage(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "text";
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      /* not json */
    }
  }
  if (
    /^(import |export |from |const |let |var |function |=>|async |await |class |interface |type |enum )/.test(
      trimmed,
    )
  )
    return "javascript";
  if (/^(def |class |import |from |print|if __name__)/.test(trimmed)) return "python";
  if (/^(<!DOCTYPE|<html|<div|<span|<head|<body)/.test(trimmed)) return "html";
  if (/^(CREATE |SELECT |INSERT |UPDATE |DELETE |DROP |ALTER )/.test(trimmed.toUpperCase()))
    return "sql";
  if (/^(#|##|###)/.test(trimmed)) return "markdown";
  if (trimmed.startsWith("#!")) return "sh";
  return "text";
}

const i18nStrings: CodeEditorProps.I18nStrings = {
  loadingState: "Loading code editor...",
  errorState: "Error loading code editor",
  errorStateRecovery: "Retry",
  editorGroupAriaLabel: "Code editor",
  statusBarGroupAriaLabel: "Status bar",
  preferencesButtonAriaLabel: "Preferences",
  paneCloseButtonAriaLabel: "Close preferences pane",
  preferencesModalHeader: "Preferences",
  preferencesModalCancel: "Cancel",
  preferencesModalConfirm: "Confirm",
  preferencesModalCloseAriaLabel: "Close preferences",
  preferencesModalWrapLines: "Wrap lines",
  preferencesModalTheme: "Theme",
  preferencesModalLightThemes: "Light themes",
  preferencesModalDarkThemes: "Dark themes",
  preferencesModalThemeFilteringPlaceholder: "Filter themes",
  preferencesModalThemeFilteringAriaLabel: "Filter themes",
  preferencesModalThemeFilteringClearAriaLabel: "Clear filter",
  resizeHandleAriaLabel: "Resize code editor",
  resizeHandleTooltipText: "Drag to resize",
  cursorPosition: (row: number, col: number) => `Ln ${row}, Col ${col}`,
  errorsTab: "Errors",
  warningsTab: "Warnings",
};

export default function AwsCodeEditor({
  value,
  onChange,
  language,
  height = 300,
  ariaLabel,
}: Props) {
  const [ace, setAce] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<CodeEditorProps.Preferences>({
    wrapLines: true,
    theme: "dawn",
  });

  const detectedLanguage = useMemo(() => language || detectLanguage(value), [language, value]);

  React.useEffect(() => {
    import("ace-builds")
      .then((aceModule) => {
        Promise.allSettled([
          import("ace-builds/src-noconflict/mode-javascript"),
          import("ace-builds/src-noconflict/mode-python"),
          import("ace-builds/src-noconflict/mode-json"),
          import("ace-builds/src-noconflict/mode-html"),
          import("ace-builds/src-noconflict/mode-sql"),
          import("ace-builds/src-noconflict/mode-sh"),
          import("ace-builds/src-noconflict/mode-markdown"),
          import("ace-builds/src-noconflict/mode-text"),
          import("ace-builds/src-noconflict/theme-dawn"),
          import("ace-builds/src-noconflict/theme-monokai"),
        ]).then(() => {
          setAce(aceModule.default);
          setLoading(false);
        });
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleDelayedChange = useCallback(
    (event: { detail: { value: string } }) => {
      onChange?.(event.detail.value);
    },
    [onChange],
  );

  const handleRecoveryClick = useCallback(() => {
    window.location.reload();
  }, []);

  if (!ace) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--awsui-color-background-container-content)",
          borderRadius: "4px",
          border: "1px solid var(--awsui-color-border-default)",
        }}
      >
        {loading ? "Loading code editor..." : "Code editor unavailable"}
      </div>
    );
  }

  return (
    <CodeEditor
      ace={ace}
      value={value}
      language={detectedLanguage}
      onDelayedChange={handleDelayedChange}
      onPreferencesChange={({ detail }) => setPreferences(detail)}
      preferences={preferences}
      loading={loading}
      onRecoveryClick={handleRecoveryClick}
      editorContentHeight={height}
      i18nStrings={i18nStrings}
      ariaLabel={ariaLabel}
    />
  );
}
