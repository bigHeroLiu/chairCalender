import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

const app = express();

// 解析 JSON 请求体（AI 聊天接口需要）
app.use(express.json({ limit: '1mb' }));

// 静态文件目录
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback: 所有非 API 路由返回 index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n📅 总裁办日历服务已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   模式: ${isDev ? '开发' : '生产'}\n`);
});
