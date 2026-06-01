import { Router } from 'express';
import { bookingController } from '../controllers/bookingController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, bookingController.myBookings);
router.get('/admin', authenticate, requireRole('admin'), bookingController.allBookings);
router.post('/', authenticate, bookingController.create);
router.post('/:id/cancel', authenticate, bookingController.cancel);

export default router;
