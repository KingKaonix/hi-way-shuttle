import { Router } from 'express';
import { driverController } from '../controllers/driverController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/available', driverController.findAvailable);
router.post('/register', authenticate, driverController.register);
router.get('/profile', authenticate, driverController.profile);
router.post('/:id/location', authenticate, driverController.updateLocation);
router.post('/:id/online', authenticate, driverController.toggleOnline);
router.post('/vehicles', authenticate, driverController.addVehicle);
router.post('/availability', authenticate, driverController.setAvailability);

export default router;
