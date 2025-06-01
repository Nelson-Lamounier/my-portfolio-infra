/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  watchman: false,
  testMatch: ["**/tests/**/*.test.ts"], // adjust if your tests are elsewhere
  moduleFileExtensions: ["ts", "js", "json", "node"],
  roots: ["<rootDir>/src", "<rootDir>/tests"],
};
