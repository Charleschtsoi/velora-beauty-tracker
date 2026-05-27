-- CHANEL UV Essentiel: manufacturing March 2025, batch 1502 (per product packaging report)
update demo_products
set
  production_date = '2025-03-01',
  notes =
    'Global protection formula enriched with ginger from Madagascar; made in France. Batch code: 1502. Manufactured: March 2025.',
  secondary_ocr_cues = array[
    'PROTECTION GLOBALE',
    'GLOBAL PROTECTION',
    '30 ml',
    '1502'
  ],
  updated_at = now()
where id = 'demo_002_chanel_uv';
