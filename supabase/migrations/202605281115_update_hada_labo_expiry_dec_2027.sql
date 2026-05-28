update demo_products
set
  expiration_date = '2027-12-31',
  updated_at = now()
where id = 'demo_005_hada_labo_gokujyun_milk';
