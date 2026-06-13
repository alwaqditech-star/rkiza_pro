-- جمعية تجريبية مع بيانات افتراضية
-- يُفضّل تشغيل السكربت: npx tsx scripts/seed-demo-association.ts
-- (ينشئ الجمعية + دليل الحسابات + الإعدادات + بنك + موظفين + سندات)

USE rikaz_accounting_db;

-- username: alkhair | password: demo123
INSERT INTO associations (
  association_name, username, password_hash,
  is_first_login, subscription_start, subscription_end, status
) VALUES (
  'جمعية الخير التنموية',
  'alkhair',
  '$2b$10$30Onq8zUj9QGpeXka4it7OJ9t8QtEP.Ce8uxu3RYGjZwP94v8VKP.',
  0,
  CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 1 YEAR),
  'active'
)
ON DUPLICATE KEY UPDATE
  association_name = VALUES(association_name),
  password_hash = VALUES(password_hash),
  is_first_login = 0,
  subscription_start = CURDATE(),
  subscription_end = DATE_ADD(CURDATE(), INTERVAL 1 YEAR),
  status = 'active';

-- بعد إنشاء الجمعية شغّل السكربت لإكمال البيانات الافتراضية.
