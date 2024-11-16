import express from 'express';
import { PathChecker } from '../services/path-checker';
import { PathCheckRequest, PathCheckResponse } from '../types';

const router = express.Router();
const pathChecker = new PathChecker();

router.post('/check-path', async (req, res) => {
  const { path, type } = req.body as PathCheckRequest;
  
  console.log('Received path check request:', { path, type });

  try {
    const exists = await pathChecker.checkPath(path, type);
    console.log('Path check result:', { path, exists });
    
    const response: PathCheckResponse = { exists };
    res.json(response);
  } catch (error) {
    console.error('Path check error:', error);
    
    const response: PathCheckResponse = {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(400).json(response);
  }
});

export default router;