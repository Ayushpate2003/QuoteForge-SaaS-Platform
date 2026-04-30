import { Router } from 'express';
import * as itemsController from '../controllers/items.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.get('/', authenticate, itemsController.getItems);
router.post('/', authenticate, authorize(['admin']), itemsController.createItem);
router.post('/bulk', authenticate, authorize(['admin']), itemsController.bulkCreateItems);

router.put('/:id', authenticate, authorize(['admin']), itemsController.updateItem);
router.delete('/:id', authenticate, authorize(['admin']), itemsController.deleteItem);

export default router;
