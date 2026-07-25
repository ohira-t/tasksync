-- 一時スクリプト（適用後に削除する）
-- マイグレーションフォルダ名の年を 2025 → 2026 に修正したため、
-- 本番DBの _prisma_migrations に記録された名前も追随させる。
-- SQL本文は変更していないので checksum は一致したままで問題ない。
-- 旧名が無ければ0行更新で終わるため、複数回実行しても安全。
UPDATE "_prisma_migrations"
SET migration_name = '20260519000000_add_screenshot_is_main'
WHERE migration_name = '20250519000000_add_screenshot_is_main';

UPDATE "_prisma_migrations"
SET migration_name = '20260519010000_add_backlog_url'
WHERE migration_name = '20250519010000_add_backlog_url';
