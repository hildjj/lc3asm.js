export default {
  "collectCoverage": true,
  "coverageReporters": ["lcov"],
  "roots": [
    "<rootDir>/test",
  ],
  "testMatch": [
    "**/*.spec.js",
  ],
  "collectCoverageFrom": [
    "src/**",
    "bin/**",
  ],
};
