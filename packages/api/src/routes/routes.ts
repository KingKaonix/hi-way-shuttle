import { Router } from 'express';
import { routeController } from '../controllers/routeController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', routeController.list);
router.get('/:id', routeController.getById);
router.post('/', authenticate, requireRole('admin'), routeController.create);
router.put('/:id', authenticate, requireRole('admin'), routeController.update);
router.delete('/:id', authenticate, requireRole('admin'), routeController.remove);

export default router;
