-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "business_name" VARCHAR(255) NOT NULL,
    "subdomain" VARCHAR(100) NOT NULL,
    "legal_entity_name" VARCHAR(255),
    "plan_type" VARCHAR(50) NOT NULL DEFAULT 'starter',
    "subscription_status" VARCHAR(50) NOT NULL DEFAULT 'trial',
    "subscription_started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscription_ends_at" TIMESTAMPTZ(6),
    "trial_ends_at" TIMESTAMPTZ(6),
    "currency_code" CHAR(3) NOT NULL DEFAULT 'USD',
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "country_code" CHAR(2) NOT NULL,
    "tax_id" VARCHAR(100),
    "db_shard_key" VARCHAR(50) DEFAULT 'primary',
    "max_locations" INTEGER DEFAULT 1,
    "max_users" INTEGER DEFAULT 5,
    "max_products" INTEGER DEFAULT 100,
    "features" JSONB DEFAULT '{"kds": false, "loyalty": false, "analytics": true}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_reason" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50),
    "location_type" VARCHAR(50) DEFAULT 'restaurant',
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country_code" CHAR(2),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "business_hours" JSONB DEFAULT '{}',
    "timezone" VARCHAR(100),
    "currency_code" CHAR(3),
    "tax_settings" JSONB DEFAULT '{}',
    "receipt_settings" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "opened_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "display_name" VARCHAR(255),
    "password_hash" VARCHAR(255),
    "pin_code_hash" VARCHAR(255),
    "role" VARCHAR(50) NOT NULL DEFAULT 'cashier',
    "permissions" JSONB DEFAULT '[]',
    "employee_code" VARCHAR(50),
    "job_title" VARCHAR(100),
    "hourly_rate" DECIMAL(10,2),
    "allowed_locations" UUID[] DEFAULT ARRAY[]::UUID[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_login_at" TIMESTAMPTZ(6),
    "last_login_ip" INET,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255),
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "color_hex" VARCHAR(7),
    "icon_url" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "available_days" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[],
    "available_from" TIME(6),
    "available_to" TIME(6),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "category_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255),
    "short_name" VARCHAR(100),
    "description" TEXT,
    "plu_number" VARCHAR(50),
    "sku" VARCHAR(100),
    "base_price" DECIMAL(12,4) NOT NULL,
    "cost_price" DECIMAL(12,4),
    "tax_rate" DECIMAL(5,4),
    "tax_included" BOOLEAN NOT NULL DEFAULT false,
    "product_type" VARCHAR(50) NOT NULL DEFAULT 'standard',
    "is_combo" BOOLEAN NOT NULL DEFAULT false,
    "parent_product_id" UUID,
    "prep_time_minutes" INTEGER DEFAULT 0,
    "kitchen_station" VARCHAR(100),
    "cooking_instructions" TEXT,
    "kds_display_name" VARCHAR(255),
    "kds_color" VARCHAR(7),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "available_for_online" BOOLEAN NOT NULL DEFAULT true,
    "available_for_pos" BOOLEAN NOT NULL DEFAULT true,
    "available_days" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[],
    "available_from" TIME(6),
    "available_to" TIME(6),
    "track_inventory" BOOLEAN NOT NULL DEFAULT false,
    "current_stock" DECIMAL(10,2),
    "low_stock_threshold" DECIMAL(10,2),
    "out_of_stock" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "landscape_image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "color_hex" VARCHAR(7),
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "featured_on_kiosk" BOOLEAN NOT NULL DEFAULT false,
    "exclude_from_recommendations" BOOLEAN NOT NULL DEFAULT false,
    "calories" INTEGER,
    "analysis_code_1" VARCHAR(50),
    "analysis_code_2" VARCHAR(50),
    "report_category" VARCHAR(100),
    "report_group" VARCHAR(100),
    "barcodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes_for_pos" TEXT,
    "notes_for_receipt" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_location_prices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "price" DECIMAL(12,4) NOT NULL,
    "cost_price" DECIMAL(12,4),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_location_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_groups" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255),
    "short_name" VARCHAR(100),
    "description" TEXT,
    "selection_type" VARCHAR(50) NOT NULL DEFAULT 'multiple',
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "min_selections" INTEGER NOT NULL DEFAULT 0,
    "max_selections" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display_in_wizard" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifiers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255),
    "short_name" VARCHAR(100),
    "description" TEXT,
    "plu_number" VARCHAR(50),
    "price_change" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "price_type" VARCHAR(20) NOT NULL DEFAULT 'add',
    "cost_change" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "affects_preparation" BOOLEAN NOT NULL DEFAULT false,
    "kitchen_instructions" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "inventory_item_id" UUID,
    "inventory_qty_used" DECIMAL(10,4),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_modifier_groups" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "modifier_group_id" UUID NOT NULL,
    "is_required" BOOLEAN,
    "min_selections" INTEGER,
    "max_selections" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "combo_product_id" UUID NOT NULL,
    "item_product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "price_override" DECIMAL(12,4),
    "selection_group" VARCHAR(100),
    "max_quantity" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combo_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "display_number" VARCHAR(20),
    "external_order_id" VARCHAR(255),
    "order_type" VARCHAR(50) NOT NULL DEFAULT 'dine_in',
    "order_source" VARCHAR(50) NOT NULL DEFAULT 'pos',
    "customer_id" UUID,
    "customer_name" VARCHAR(255),
    "customer_phone" VARCHAR(50),
    "customer_email" VARCHAR(255),
    "delivery_address" JSONB,
    "delivery_instructions" TEXT,
    "delivery_fee" DECIMAL(10,2),
    "delivery_driver_id" UUID,
    "table_number" VARCHAR(50),
    "seat_number" VARCHAR(20),
    "station_name" VARCHAR(100),
    "created_by_user_id" UUID NOT NULL,
    "cashier_user_id" UUID,
    "server_user_id" UUID,
    "subtotal" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "discount_amount" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "tax_amount" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "tip_amount" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "service_charge" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "amount_paid" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "amount_due" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "rounding_amount" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "order_status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "payment_status" VARCHAR(50) NOT NULL DEFAULT 'unpaid',
    "fulfillment_status" VARCHAR(50),
    "sent_to_kitchen_at" TIMESTAMPTZ(6),
    "kitchen_completed_at" TIMESTAMPTZ(6),
    "estimated_ready_time" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "voided_at" TIMESTAMPTZ(6),
    "void_reason" TEXT,
    "voided_by_user_id" UUID,
    "customer_notes" TEXT,
    "internal_notes" TEXT,
    "is_on_hold" BOOLEAN NOT NULL DEFAULT false,
    "hold_reason" TEXT,
    "fire_time" TIMESTAMPTZ(6),
    "is_split" BOOLEAN NOT NULL DEFAULT false,
    "split_parent_order_id" UUID,
    "split_number" INTEGER,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "item_sku" VARCHAR(100),
    "unit_price" DECIMAL(12,4) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 1.000,
    "discount_amount" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "tax_amount" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "tax_rate" DECIMAL(5,4),
    "line_total" DECIMAL(12,4) NOT NULL,
    "cost_price" DECIMAL(12,4),
    "kitchen_station" VARCHAR(100),
    "cooking_instructions" TEXT,
    "prep_status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "prep_started_at" TIMESTAMPTZ(6),
    "prep_completed_at" TIMESTAMPTZ(6),
    "course_number" INTEGER NOT NULL DEFAULT 1,
    "fire_time" TIMESTAMPTZ(6),
    "is_on_hold" BOOLEAN NOT NULL DEFAULT false,
    "special_instructions" TEXT,
    "customer_notes" TEXT,
    "is_combo_parent" BOOLEAN NOT NULL DEFAULT false,
    "is_combo_child" BOOLEAN NOT NULL DEFAULT false,
    "combo_parent_id" UUID,
    "combo_group" VARCHAR(100),
    "is_voided" BOOLEAN NOT NULL DEFAULT false,
    "void_reason" TEXT,
    "voided_at" TIMESTAMPTZ(6),
    "voided_by_user_id" UUID,
    "refund_amount" DECIMAL(12,4),
    "refunded_at" TIMESTAMPTZ(6),
    "seat_number" VARCHAR(20),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_modifiers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "modifier_id" UUID NOT NULL,
    "modifier_group_id" UUID NOT NULL,
    "modifier_name" VARCHAR(255) NOT NULL,
    "modifier_price" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "payment_provider" VARCHAR(100),
    "amount" DECIMAL(12,4) NOT NULL,
    "card_last_4" VARCHAR(4),
    "card_brand" VARCHAR(50),
    "card_type" VARCHAR(20),
    "transaction_id" VARCHAR(255),
    "authorization_code" VARCHAR(100),
    "merchant_id" VARCHAR(100),
    "terminal_id" VARCHAR(100),
    "cash_tendered" DECIMAL(12,4),
    "cash_change" DECIMAL(12,4),
    "payment_status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "failure_reason" TEXT,
    "authorized_at" TIMESTAMPTZ(6),
    "captured_at" TIMESTAMPTZ(6),
    "settled_at" TIMESTAMPTZ(6),
    "refunded_at" TIMESTAMPTZ(6),
    "refund_amount" DECIMAL(12,4),
    "refund_transaction_id" VARCHAR(255),
    "refund_reason" TEXT,
    "processed_by_user_id" UUID,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "code" VARCHAR(100),
    "promotion_type" VARCHAR(50) NOT NULL,
    "discount_type" VARCHAR(50),
    "discount_value" DECIMAL(12,4),
    "max_discount_amount" DECIMAL(12,4),
    "min_order_amount" DECIMAL(12,4),
    "applicable_products" UUID[] DEFAULT ARRAY[]::UUID[],
    "applicable_categories" UUID[] DEFAULT ARRAY[]::UUID[],
    "excluded_products" UUID[] DEFAULT ARRAY[]::UUID[],
    "buy_quantity" INTEGER,
    "get_quantity" INTEGER,
    "get_product_id" UUID,
    "get_discount_percent" DECIMAL(5,2),
    "valid_from" TIMESTAMPTZ(6),
    "valid_to" TIMESTAMPTZ(6),
    "valid_days" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[],
    "valid_hours_from" TIME(6),
    "valid_hours_to" TIME(6),
    "max_uses_per_customer" INTEGER,
    "max_total_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "auto_apply" BOOLEAN NOT NULL DEFAULT false,
    "requires_code" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "voucher_type" VARCHAR(50) NOT NULL DEFAULT 'gift_card',
    "initial_value" DECIMAL(12,4) NOT NULL,
    "current_balance" DECIMAL(12,4) NOT NULL,
    "currency_code" CHAR(3),
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "customer_id" UUID,
    "issued_by_user_id" UUID,
    "min_order_amount" DECIMAL(12,4),
    "applicable_locations" UUID[] DEFAULT ARRAY[]::UUID[],
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_transactions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "voucher_id" UUID NOT NULL,
    "order_id" UUID,
    "transaction_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(12,4) NOT NULL,
    "balance_before" DECIMAL(12,4) NOT NULL,
    "balance_after" DECIMAL(12,4) NOT NULL,
    "processed_by_user_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_promotions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "promotion_id" UUID,
    "voucher_id" UUID,
    "discount_type" VARCHAR(50),
    "discount_amount" DECIMAL(12,4) NOT NULL,
    "discount_reason" TEXT,
    "code_used" VARCHAR(100),
    "authorized_by_user_id" UUID,
    "authorization_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "rule_type" VARCHAR(50) NOT NULL DEFAULT 'points_per_dollar',
    "points_per_dollar" DECIMAL(5,2),
    "points_per_visit" INTEGER,
    "min_purchase_amount" DECIMAL(10,2),
    "redemption_rate" DECIMAL(10,4),
    "min_points_for_redemption" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMPTZ(6),
    "valid_to" TIMESTAMPTZ(6),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "loyalty_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(50) NOT NULL,
    "date_of_birth" DATE,
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country_code" CHAR(2),
    "loyalty_member" BOOLEAN NOT NULL DEFAULT false,
    "loyalty_tier" VARCHAR(50) NOT NULL DEFAULT 'bronze',
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "loyalty_joined_at" TIMESTAMPTZ(6),
    "wallet_balance" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "sms_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "email_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "last_order_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_reason" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "order_id" UUID,
    "transaction_type" VARCHAR(50) NOT NULL,
    "points_change" INTEGER NOT NULL,
    "points_balance_before" INTEGER NOT NULL,
    "points_balance_after" INTEGER NOT NULL,
    "dollar_amount" DECIMAL(12,4),
    "description" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "location_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(100),
    "barcode" VARCHAR(100),
    "description" TEXT,
    "category" VARCHAR(100),
    "subcategory" VARCHAR(100),
    "unit_of_measure" VARCHAR(50) NOT NULL DEFAULT 'piece',
    "conversion_factor" DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    "current_stock" DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
    "minimum_stock" DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
    "maximum_stock" DECIMAL(12,4),
    "reorder_point" DECIMAL(12,4),
    "reorder_quantity" DECIMAL(12,4),
    "unit_cost" DECIMAL(12,4),
    "avg_cost" DECIMAL(12,4),
    "last_purchase_cost" DECIMAL(12,4),
    "primary_supplier_id" UUID,
    "supplier_sku" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "track_stock" BOOLEAN NOT NULL DEFAULT true,
    "allow_negative_stock" BOOLEAN NOT NULL DEFAULT false,
    "low_stock_alert" BOOLEAN NOT NULL DEFAULT false,
    "out_of_stock" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "quantity_used" DECIMAL(12,4) NOT NULL,
    "unit_of_measure" VARCHAR(50),
    "cost_per_unit" DECIMAL(12,4),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_adjustments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "location_id" UUID,
    "adjustment_type" VARCHAR(50) NOT NULL,
    "quantity_change" DECIMAL(12,4) NOT NULL,
    "quantity_before" DECIMAL(12,4) NOT NULL,
    "quantity_after" DECIMAL(12,4) NOT NULL,
    "unit_cost" DECIMAL(12,4),
    "total_cost" DECIMAL(12,4),
    "reason" TEXT,
    "reference_number" VARCHAR(100),
    "adjusted_by_user_id" UUID,
    "approved_by_user_id" UUID,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "terminal_name" VARCHAR(255) NOT NULL,
    "terminal_number" INTEGER,
    "device_id" VARCHAR(255),
    "ip_address_external" INET,
    "ip_address_internal" INET,
    "mac_address" VARCHAR(17),
    "device_model" VARCHAR(100),
    "os_version" VARCHAR(100),
    "app_version" VARCHAR(50),
    "is_main_terminal" BOOLEAN NOT NULL DEFAULT false,
    "is_online_order_enabled" BOOLEAN NOT NULL DEFAULT false,
    "printer_mappings" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_licensed" BOOLEAN NOT NULL DEFAULT false,
    "license_expires_at" TIMESTAMPTZ(6),
    "last_heartbeat_at" TIMESTAMPTZ(6),
    "connection_status" VARCHAR(50) NOT NULL DEFAULT 'offline',
    "last_sync_at" TIMESTAMPTZ(6),
    "pending_sync_items" INTEGER NOT NULL DEFAULT 0,
    "merchant_id" VARCHAR(255),
    "tyro_pairing_status" VARCHAR(50),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_sales_summary" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "total_tax" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "total_discount" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "total_tips" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "net_sales" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "dine_in_orders" INTEGER NOT NULL DEFAULT 0,
    "dine_in_revenue" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "takeaway_orders" INTEGER NOT NULL DEFAULT 0,
    "takeaway_revenue" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "delivery_orders" INTEGER NOT NULL DEFAULT 0,
    "delivery_revenue" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "cash_payments" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "card_payments" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "digital_payments" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "unique_customers" INTEGER NOT NULL DEFAULT 0,
    "new_customers" INTEGER NOT NULL DEFAULT 0,
    "returning_customers" INTEGER NOT NULL DEFAULT 0,
    "avg_order_value" DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    "top_selling_product_id" UUID,
    "top_selling_category_id" UUID,
    "last_calculated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "daily_sales_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "table_name" VARCHAR(100) NOT NULL,
    "record_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_fields" TEXT[],
    "user_id" UUID,
    "user_email" VARCHAR(255),
    "user_role" VARCHAR(50),
    "ip_address" INET,
    "user_agent" TEXT,
    "terminal_id" UUID,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE INDEX "idx_tenants_subdomain" ON "tenants"("subdomain");

-- CreateIndex
CREATE INDEX "idx_tenants_status" ON "tenants"("subscription_status", "is_active");

-- CreateIndex
CREATE INDEX "idx_tenants_shard" ON "tenants"("db_shard_key");

-- CreateIndex
CREATE INDEX "idx_locations_tenant" ON "locations"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_locations_tenant_code" ON "locations"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "locations_tenant_id_name_key" ON "locations"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "idx_users_tenant" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "idx_users_pin" ON "users"("tenant_id", "pin_code_hash");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("tenant_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "idx_categories_tenant" ON "categories"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_categories_parent" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "idx_categories_sort" ON "categories"("tenant_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenant_id_name_parent_id_key" ON "categories"("tenant_id", "name", "parent_id");

-- CreateIndex
CREATE INDEX "idx_products_tenant" ON "products"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("tenant_id", "category_id");

-- CreateIndex
CREATE INDEX "idx_products_plu" ON "products"("tenant_id", "plu_number");

-- CreateIndex
CREATE INDEX "idx_products_sku" ON "products"("tenant_id", "sku");

-- CreateIndex
CREATE INDEX "idx_products_parent" ON "products"("parent_product_id");

-- CreateIndex
CREATE INDEX "idx_products_stock" ON "products"("tenant_id", "track_inventory", "current_stock");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_name_category_id_key" ON "products"("tenant_id", "name", "category_id");

-- CreateIndex
CREATE INDEX "idx_product_location_prices_product" ON "product_location_prices"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_location_prices_location" ON "product_location_prices"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_location_prices_product_id_location_id_key" ON "product_location_prices"("product_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_modifier_groups_tenant" ON "modifier_groups"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "modifier_groups_tenant_id_name_key" ON "modifier_groups"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "idx_modifiers_tenant" ON "modifiers"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_modifiers_group" ON "modifiers"("group_id");

-- CreateIndex
CREATE INDEX "idx_modifiers_plu" ON "modifiers"("tenant_id", "plu_number");

-- CreateIndex
CREATE UNIQUE INDEX "modifiers_group_id_name_key" ON "modifiers"("group_id", "name");

-- CreateIndex
CREATE INDEX "idx_product_modifier_groups_product" ON "product_modifier_groups"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_modifier_groups_group" ON "product_modifier_groups"("modifier_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_modifier_groups_product_id_modifier_group_id_key" ON "product_modifier_groups"("product_id", "modifier_group_id");

-- CreateIndex
CREATE INDEX "idx_combo_items_combo" ON "combo_items"("combo_product_id");

-- CreateIndex
CREATE INDEX "idx_combo_items_item" ON "combo_items"("item_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "combo_items_combo_product_id_item_product_id_key" ON "combo_items"("combo_product_id", "item_product_id");

-- CreateIndex
CREATE INDEX "idx_orders_tenant_location" ON "orders"("tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_orders_status" ON "orders"("tenant_id", "order_status", "payment_status");

-- CreateIndex
CREATE INDEX "idx_orders_created_date" ON "orders"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_orders_number" ON "orders"("tenant_id", "order_number");

-- CreateIndex
CREATE INDEX "idx_orders_customer" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "idx_orders_kitchen" ON "orders"("tenant_id", "order_status");

-- CreateIndex
CREATE INDEX "idx_orders_unpaid" ON "orders"("tenant_id", "payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_id_location_id_order_number_key" ON "orders"("tenant_id", "location_id", "order_number");

-- CreateIndex
CREATE INDEX "idx_order_items_order" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "idx_order_items_product" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "idx_order_items_kitchen" ON "order_items"("tenant_id", "prep_status");

-- CreateIndex
CREATE INDEX "idx_order_items_combo" ON "order_items"("combo_parent_id");

-- CreateIndex
CREATE INDEX "idx_order_item_modifiers_item" ON "order_item_modifiers"("order_item_id");

-- CreateIndex
CREATE INDEX "idx_order_item_modifiers_modifier" ON "order_item_modifiers"("modifier_id");

-- CreateIndex
CREATE INDEX "idx_payments_order" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "idx_payments_tenant_date" ON "payments"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("tenant_id", "payment_status");

-- CreateIndex
CREATE INDEX "idx_payments_method" ON "payments"("tenant_id", "payment_method");

-- CreateIndex
CREATE INDEX "idx_payments_transaction" ON "payments"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_promotions_tenant" ON "promotions"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_promotions_code" ON "promotions"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "idx_promotions_valid" ON "promotions"("tenant_id", "valid_from", "valid_to");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "idx_vouchers_tenant" ON "vouchers"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_vouchers_code" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "idx_vouchers_customer" ON "vouchers"("customer_id");

-- CreateIndex
CREATE INDEX "idx_voucher_transactions_voucher" ON "voucher_transactions"("voucher_id");

-- CreateIndex
CREATE INDEX "idx_voucher_transactions_order" ON "voucher_transactions"("order_id");

-- CreateIndex
CREATE INDEX "idx_order_promotions_order" ON "order_promotions"("order_id");

-- CreateIndex
CREATE INDEX "idx_order_promotions_promotion" ON "order_promotions"("promotion_id");

-- CreateIndex
CREATE INDEX "idx_order_promotions_voucher" ON "order_promotions"("voucher_id");

-- CreateIndex
CREATE INDEX "idx_loyalty_rules_tenant" ON "loyalty_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_customers_tenant" ON "customers"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_customers_phone" ON "customers"("tenant_id", "phone");

-- CreateIndex
CREATE INDEX "idx_customers_email" ON "customers"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "idx_customers_loyalty" ON "customers"("tenant_id", "loyalty_member");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_phone_key" ON "customers"("tenant_id", "phone");

-- CreateIndex
CREATE INDEX "idx_loyalty_transactions_customer" ON "loyalty_transactions"("customer_id");

-- CreateIndex
CREATE INDEX "idx_loyalty_transactions_order" ON "loyalty_transactions"("order_id");

-- CreateIndex
CREATE INDEX "idx_inventory_items_tenant" ON "inventory_items"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_inventory_items_location" ON "inventory_items"("location_id");

-- CreateIndex
CREATE INDEX "idx_inventory_items_sku" ON "inventory_items"("tenant_id", "sku");

-- CreateIndex
CREATE INDEX "idx_inventory_items_low_stock" ON "inventory_items"("tenant_id", "low_stock_alert");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_tenant_id_name_location_id_key" ON "inventory_items"("tenant_id", "name", "location_id");

-- CreateIndex
CREATE INDEX "idx_recipes_product" ON "recipes"("product_id");

-- CreateIndex
CREATE INDEX "idx_recipes_ingredient" ON "recipes"("inventory_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_product_id_inventory_item_id_key" ON "recipes"("product_id", "inventory_item_id");

-- CreateIndex
CREATE INDEX "idx_inventory_adjustments_item" ON "inventory_adjustments"("inventory_item_id");

-- CreateIndex
CREATE INDEX "idx_inventory_adjustments_tenant_date" ON "inventory_adjustments"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_inventory_adjustments_type" ON "inventory_adjustments"("tenant_id", "adjustment_type");

-- CreateIndex
CREATE UNIQUE INDEX "terminals_device_id_key" ON "terminals"("device_id");

-- CreateIndex
CREATE INDEX "idx_terminals_tenant" ON "terminals"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_terminals_location" ON "terminals"("location_id");

-- CreateIndex
CREATE INDEX "idx_terminals_device" ON "terminals"("device_id");

-- CreateIndex
CREATE INDEX "idx_terminals_status" ON "terminals"("tenant_id", "connection_status");

-- CreateIndex
CREATE INDEX "idx_daily_sales_summary_tenant_date" ON "daily_sales_summary"("tenant_id", "date");

-- CreateIndex
CREATE INDEX "idx_daily_sales_summary_location_date" ON "daily_sales_summary"("location_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_sales_summary_tenant_id_location_id_date_key" ON "daily_sales_summary"("tenant_id", "location_id", "date");

-- CreateIndex
CREATE INDEX "idx_audit_logs_tenant_date" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_table" ON "audit_logs"("table_name", "record_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("user_id");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_parent_product_id_fkey" FOREIGN KEY ("parent_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_location_prices" ADD CONSTRAINT "product_location_prices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_location_prices" ADD CONSTRAINT "product_location_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_location_prices" ADD CONSTRAINT "product_location_prices_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_combo_product_id_fkey" FOREIGN KEY ("combo_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_item_product_id_fkey" FOREIGN KEY ("item_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cashier_user_id_fkey" FOREIGN KEY ("cashier_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_server_user_id_fkey" FOREIGN KEY ("server_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_voided_by_user_id_fkey" FOREIGN KEY ("voided_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_split_parent_order_id_fkey" FOREIGN KEY ("split_parent_order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_voided_by_user_id_fkey" FOREIGN KEY ("voided_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_combo_parent_id_fkey" FOREIGN KEY ("combo_parent_id") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifier_id_fkey" FOREIGN KEY ("modifier_id") REFERENCES "modifiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_processed_by_user_id_fkey" FOREIGN KEY ("processed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_get_product_id_fkey" FOREIGN KEY ("get_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_transactions" ADD CONSTRAINT "voucher_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_transactions" ADD CONSTRAINT "voucher_transactions_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_transactions" ADD CONSTRAINT "voucher_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_transactions" ADD CONSTRAINT "voucher_transactions_processed_by_user_id_fkey" FOREIGN KEY ("processed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_authorized_by_user_id_fkey" FOREIGN KEY ("authorized_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_rules" ADD CONSTRAINT "loyalty_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_adjusted_by_user_id_fkey" FOREIGN KEY ("adjusted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terminals" ADD CONSTRAINT "terminals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terminals" ADD CONSTRAINT "terminals_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_sales_summary" ADD CONSTRAINT "daily_sales_summary_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_sales_summary" ADD CONSTRAINT "daily_sales_summary_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
