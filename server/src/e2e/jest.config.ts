export default {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/e2e/**/*.test.ts"],
    setupFilesAfterEnv: ["./setup.ts"],
}
