-- إضافة مدير نظام: osama / osama123
-- نفّذ في phpMyAdmin على قاعدة db_aca8cd_rikaz

INSERT INTO admins (username, password_hash, name) VALUES
(
  'osama',
  '$2b$10$Aa582WXTUgh/YrPYlMNPBOinKBBTrD4WxFS6VhxJqOsVcP8f4S6be',
  'أسامة'
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  name = VALUES(name);
