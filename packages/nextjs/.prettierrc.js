module.exports = {
  arrowParens: "avoid",
  printWidth: 120,
  useTabs: true,
  trailingComma: "none",
  importOrder: ["^react$", "^next/(.*)$", "<THIRD_PARTY_MODULES>", "^@heroicons/(.*)$", "^~~/(.*)$"],
  importOrderSortSpecifiers: true,
  plugins: [require.resolve("@trivago/prettier-plugin-sort-imports")],
};
