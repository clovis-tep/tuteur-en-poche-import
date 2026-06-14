import { Request, Response } from 'express';
import multer from 'multer';
import { processExcelFile } from '../services/import.service';

export const importExcel = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const result = await processExcelFile(req.file.path);
    return res.status(200).json(result);

  } catch (error) {
    console.error(error);
    
    return res.status(500).json({ error: 'Erreur lors de l\'import' });
  }
};