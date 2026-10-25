import next from "eslint-config-next";

export default [
  ...next({
    files: ["src/app/**/page.tsx"],
  }),
  {
    ignores: ["node_modules/**", ".next/**", "dist/**"],
  },
];
