import { Router } from 'express';
import multer from 'multer';
import { 
  getFirms, 
  createFirm, 
  updateFirm, 
  deleteFirm, 
  uploadLogo, 
  uploadSignature 
} from '../controllers/firms.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication and admin role
router.use(authenticate, authorize(['admin']));

router.get('/', getFirms);
router.post('/', createFirm);
router.put('/:id', updateFirm);
router.delete('/:id', deleteFirm);

router.post('/:id/logo', upload.single('logo'), uploadLogo);
router.post('/:id/signature', upload.single('signature'), uploadSignature);

export default router;
