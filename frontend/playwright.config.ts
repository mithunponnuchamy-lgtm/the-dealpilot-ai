import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests', workers:1, timeout:30000,
  use:{baseURL:'http://localhost:3000',trace:'retain-on-failure'},
  webServer:[
    {command:`"${process.env.PLAYWRIGHT_PYTHON||'python'}" ../backend/tests/serve_e2e.py`,url:'http://localhost:8000/health',reuseExistingServer:true,timeout:30000},
    {command:'npm run dev',url:'http://localhost:3000',reuseExistingServer:true,timeout:90000,env:{NEXT_PUBLIC_API_URL:'http://localhost:8000'}}
  ]
});
