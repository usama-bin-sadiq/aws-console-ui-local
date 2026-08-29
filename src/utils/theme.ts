export const getThemedColor = (
  theme: "dark" | "light",
  darkColor: string,
  lightColor: string
) => {
  return theme === "dark" ? darkColor : lightColor;
};

// Use Cloudscape CSS variables for theming
export const THEME_COLORS = {
  dark: {
    background: "var(--awsui-color-background-container-content)",
    text: "var(--awsui-color-text-body-default)",
    border: "var(--awsui-color-border-divider-default)",
    hover: "var(--awsui-color-background-container-header)",
  },
  light: {
    background: "var(--awsui-color-background-container-content)",
    text: "var(--awsui-color-text-body-default)",
    border: "var(--awsui-color-border-divider-default)",
    hover: "var(--awsui-color-background-container-header)",
  },
};

// Provider badge colors
export const getProviderBadgeColor = (
  provider: "ministack" | "localstack" | "unknown"
): "green" | "blue" | "red" => {
  switch (provider) {
    case "ministack":
      return "green";
    case "localstack":
      return "blue";
    case "unknown":
      return "red";
  }
};
