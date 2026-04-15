-- 🔐 ACTUALIZAR CONTRASEÑAS CON BCRYPT HASH
-- Hashes generados con bcrypt (rounds: 10)
-- Ejecuta estos comandos en tu cliente PostgreSQL

-- Usuario: facundo@test.com | Contraseña: 123456
UPDATE users SET password_hash = '$2b$10$DIwO55MoOpGfMPWs.8xRh.EZYGFTbDLeh7RuyqH2gJcnM/ZLd2mru' WHERE email = 'facundo@test.com';

-- Usuario: ismael@test.com | Contraseña: 123456
UPDATE users SET password_hash = '$2b$10$34WEp/9Hr9mDVeGAEPjUd.N.RAW9ifFcY8A3ZbhQWkIjQ1xxInDwK' WHERE email = 'ismael@test.com';

-- Usuario: admin@srmobic.com | Contraseña: admin123
UPDATE users SET password_hash = '$2b$10$Q5ZcY/TXETVMdELy4jRcf.u5byTGkI24KsVWp3B6it72NuYiAMfbG' WHERE email = 'admin@srmobic.com';

-- Usuario: joseg3402@gmail.com | Contraseña: 123456
UPDATE users SET password_hash = '$2b$10$ZxTSCDM5pcwtr5u5stiVHuzZLHDtdMkC0jNxkaz.rP1WUF821TCUK' WHERE email = 'joseg3402@gmail.com';

-- ✅ Verificar que se actualizaron correctamente
SELECT id, email, password_hash FROM users WHERE email IN ('facundo@test.com', 'ismael@test.com', 'admin@srmobic.com', 'joseg3402@gmail.com');
