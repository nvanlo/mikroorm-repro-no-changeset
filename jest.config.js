module.exports = {
    testTimeout: 30000,
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*test.ts"],
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
};