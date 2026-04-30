import { Router } from 'express';
import * as quotesController from '../controllers/quotes.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { quoteSchema, updateStatusSchema } from '../validations/quote.schema';

const router = Router();

router.get('/', authenticate, quotesController.getQuotes);
router.post('/', authenticate, validate(quoteSchema), quotesController.createQuote);
router.get('/:id', authenticate, quotesController.getQuoteById);
router.patch('/:id/status', authenticate, validate(updateStatusSchema), quotesController.updateQuoteStatus);
router.get('/:id/pdf', authenticate, quotesController.generateQuotePdf);
router.post('/:id/send-email', authenticate, quotesController.sendQuoteEmail);
router.put('/:id', authenticate, validate(quoteSchema), quotesController.updateQuote);

export default router;
