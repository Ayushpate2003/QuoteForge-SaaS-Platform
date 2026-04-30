import { Router } from 'express';
import * as templatesController from '../controllers/templates.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.get('/', authenticate, templatesController.getTemplates);
router.post('/', authenticate, authorize(['admin']), templatesController.createTemplate);
router.put('/:id', authenticate, authorize(['admin']), templatesController.updateTemplate);
router.delete('/:id', authenticate, authorize(['admin']), templatesController.deleteTemplate);

export default router;
