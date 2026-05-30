ALTER TABLE public.orders ALTER COLUMN currency SET DEFAULT 'INR';

UPDATE public.orders
SET currency = 'INR'
WHERE currency = 'USD';
