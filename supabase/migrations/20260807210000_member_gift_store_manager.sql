-- Member gift phase 4: store_manager role + reversal request audit helpers

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'store_manager';
