import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pathCheckRouter from './routes/path-check';

// 環境変数の読み込み
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());

// すべてのリクエストをログ出力
app.use((req, res, next) => {
  console.log('Request received:', {
    method: req.method,
    path: req.path,
    body: req.body
  });
  next();
});

// ルートの設定
app.use('/api', pathCheckRouter);

// 基本的なルートハンドラ
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

// サーバー起動
app.listen(port, () => {
  console.log('=================================');
  console.log(`Backend server is running on port ${port}`);
  console.log('=================================');
});