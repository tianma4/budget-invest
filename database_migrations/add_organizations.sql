-- Migration to add organization support to budget-invest

-- Create organizations table
CREATE TABLE `organization` (
  `organization_id` INTEGER PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT NULL,
  `default_currency` TEXT NOT NULL,
  `owner_uid` INTEGER NOT NULL,
  `deleted` INTEGER NOT NULL DEFAULT 0,
  `created_unix_time` INTEGER NULL,
  `updated_unix_time` INTEGER NULL,
  `deleted_unix_time` INTEGER NULL
);

-- Create user_organization table for membership
CREATE TABLE `user_organization` (
  `uid` INTEGER NOT NULL,
  `organization_id` INTEGER NOT NULL,
  `role` INTEGER NOT NULL,
  `invited` INTEGER NOT NULL DEFAULT 0,
  `invite_token` TEXT NULL,
  `joined_unix_time` INTEGER NULL,
  `invited_unix_time` INTEGER NULL,
  `created_unix_time` INTEGER NULL,
  `updated_unix_time` INTEGER NULL,
  PRIMARY KEY (`uid`, `organization_id`)
);

-- Add organization_id column to accounts table
ALTER TABLE `account` ADD COLUMN `organization_id` INTEGER NOT NULL DEFAULT 0;

-- Add organization_id column to transaction table
ALTER TABLE `transaction` ADD COLUMN `organization_id` INTEGER NOT NULL DEFAULT 0;

-- Add organization_id column to transaction_category table
ALTER TABLE `transaction_category` ADD COLUMN `organization_id` INTEGER NOT NULL DEFAULT 0;

-- Add organization_id column to transaction_tag table
ALTER TABLE `transaction_tag` ADD COLUMN `organization_id` INTEGER NOT NULL DEFAULT 0;

-- Add organization_id column to transaction_template table
ALTER TABLE `transaction_template` ADD COLUMN `organization_id` INTEGER NOT NULL DEFAULT 0;

-- Create indexes for organizations
CREATE INDEX `IDX_organization_owner_uid_deleted` ON `organization` (`owner_uid`, `deleted`);
CREATE INDEX `IDX_organization_deleted` ON `organization` (`deleted`);

-- Create indexes for user_organization
CREATE INDEX `IDX_user_organization_organization_id_invited` ON `user_organization` (`organization_id`, `invited`);
CREATE INDEX `IDX_user_organization_uid_invited` ON `user_organization` (`uid`, `invited`);
CREATE INDEX `IDX_user_organization_invite_token` ON `user_organization` (`invite_token`);

-- Create indexes for organization-based queries
CREATE INDEX `IDX_account_org_deleted_parent_account_id_order` ON `account` (`organization_id`, `deleted`, `parent_account_id`, `display_order`);
CREATE INDEX `IDX_transaction_org_deleted_time` ON `transaction` (`organization_id`, `deleted`, `transaction_time`);
CREATE INDEX `IDX_transaction_category_org_deleted_type_parent_category_id_order` ON `transaction_category` (`organization_id`, `deleted`, `type`, `parent_category_id`, `display_order`);
CREATE INDEX `IDX_transaction_tag_org_deleted_order` ON `transaction_tag` (`organization_id`, `deleted`, `display_order`);
CREATE INDEX `IDX_transaction_template_org_deleted_template_type_order` ON `transaction_template` (`organization_id`, `deleted`, `template_type`, `display_order`);

-- Data migration: Create default organizations for existing users
-- This script assumes we want to migrate existing data by creating a personal organization for each user

-- Step 1: Create personal organizations for each user
INSERT INTO `organization` (`organization_id`, `name`, `description`, `default_currency`, `owner_uid`, `deleted`, `created_unix_time`, `updated_unix_time`)
SELECT
  `uid` as `organization_id`,  -- Use uid as organization_id for simplicity
  `username` || '''s Organization' as `name`,
  'Personal organization for ' || `username` as `description`,
  `default_currency`,
  `uid` as `owner_uid`,
  0 as `deleted`,
  strftime('%s', 'now') as `created_unix_time`,
  strftime('%s', 'now') as `updated_unix_time`
FROM `user`
WHERE `deleted` = 0;

-- Step 2: Add users as owners to their personal organizations
INSERT INTO `user_organization` (`uid`, `organization_id`, `role`, `invited`, `joined_unix_time`, `created_unix_time`, `updated_unix_time`)
SELECT
  `uid`,
  `uid` as `organization_id`,  -- Match the organization_id from step 1
  1 as `role`,  -- ORGANIZATION_ROLE_OWNER = 1
  0 as `invited`,
  strftime('%s', 'now') as `joined_unix_time`,
  strftime('%s', 'now') as `created_unix_time`,
  strftime('%s', 'now') as `updated_unix_time`
FROM `user`
WHERE `deleted` = 0;

-- Step 3: Update all accounts to use the organization_id
UPDATE `account`
SET `organization_id` = `uid`
WHERE `deleted` = 0;

-- Step 4: Update all transactions to use the organization_id
UPDATE `transaction`
SET `organization_id` = `uid`
WHERE `deleted` = 0;

-- Step 5: Update all transaction categories to use the organization_id
UPDATE `transaction_category`
SET `organization_id` = `uid`
WHERE `deleted` = 0;

-- Step 6: Update all transaction tags to use the organization_id
UPDATE `transaction_tag`
SET `organization_id` = `uid`
WHERE `deleted` = 0;

-- Step 7: Update all transaction templates to use the organization_id
UPDATE `transaction_template`
SET `organization_id` = `uid`
WHERE `deleted` = 0;