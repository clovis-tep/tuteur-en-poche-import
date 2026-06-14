import { Router } from 'express';
import { importExcel } from '../controllers/import.controller';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'upload/' });

router.post('/import/excel', upload.single('file'), importExcel);

export default router;