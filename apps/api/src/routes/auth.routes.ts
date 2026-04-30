import { Router } from 'express';
import { inviteUser, getUsers, assignFirms } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

// Only admins can invite users
router.post('/invite', authenticate, authorize(['admin']), inviteUser);
router.get('/users', authenticate, authorize(['admin']), getUsers);
router.put('/users/:userId/firms', authenticate, authorize(['admin']), assignFirms);

export default router;
