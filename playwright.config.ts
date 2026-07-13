import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir:"./e2e", use:{baseURL:"http://127.0.0.1:5173",trace:"retain-on-failure"}, projects:[{name:"chromium",use:{browserName:"chromium",launchOptions:{executablePath:process.env.PW_EXECUTABLE_PATH??"/usr/bin/google-chrome"}}}] });
