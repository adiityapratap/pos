-- AlterTable
ALTER TABLE "product_modifier_groups" ADD COLUMN     "metadata" JSONB DEFAULT '{}';

-- CreateTable
CREATE TABLE "category_locations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "category_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_locations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_group_locations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "modifier_group_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "modifier_group_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_locations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "modifier_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "price_override" DECIMAL(12,4),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "modifier_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_locations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "combo_item_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "combo_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_category_locations_category" ON "category_locations"("category_id");

-- CreateIndex
CREATE INDEX "idx_category_locations_location" ON "category_locations"("location_id");

-- CreateIndex
CREATE INDEX "idx_category_locations_tenant" ON "category_locations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_locations_category_id_location_id_key" ON "category_locations"("category_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_product_locations_product" ON "product_locations"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_locations_location" ON "product_locations"("location_id");

-- CreateIndex
CREATE INDEX "idx_product_locations_tenant" ON "product_locations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_locations_product_id_location_id_key" ON "product_locations"("product_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_modifier_group_locations_group" ON "modifier_group_locations"("modifier_group_id");

-- CreateIndex
CREATE INDEX "idx_modifier_group_locations_location" ON "modifier_group_locations"("location_id");

-- CreateIndex
CREATE INDEX "idx_modifier_group_locations_tenant" ON "modifier_group_locations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "modifier_group_locations_modifier_group_id_location_id_key" ON "modifier_group_locations"("modifier_group_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_modifier_locations_modifier" ON "modifier_locations"("modifier_id");

-- CreateIndex
CREATE INDEX "idx_modifier_locations_location" ON "modifier_locations"("location_id");

-- CreateIndex
CREATE INDEX "idx_modifier_locations_tenant" ON "modifier_locations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "modifier_locations_modifier_id_location_id_key" ON "modifier_locations"("modifier_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_combo_locations_combo" ON "combo_locations"("combo_item_id");

-- CreateIndex
CREATE INDEX "idx_combo_locations_location" ON "combo_locations"("location_id");

-- CreateIndex
CREATE INDEX "idx_combo_locations_tenant" ON "combo_locations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "combo_locations_combo_item_id_location_id_key" ON "combo_locations"("combo_item_id", "location_id");

-- AddForeignKey
ALTER TABLE "category_locations" ADD CONSTRAINT "category_locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_locations" ADD CONSTRAINT "category_locations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_locations" ADD CONSTRAINT "category_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_locations" ADD CONSTRAINT "product_locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_locations" ADD CONSTRAINT "product_locations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_locations" ADD CONSTRAINT "product_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_group_locations" ADD CONSTRAINT "modifier_group_locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_group_locations" ADD CONSTRAINT "modifier_group_locations_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_group_locations" ADD CONSTRAINT "modifier_group_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_locations" ADD CONSTRAINT "modifier_locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_locations" ADD CONSTRAINT "modifier_locations_modifier_id_fkey" FOREIGN KEY ("modifier_id") REFERENCES "modifiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_locations" ADD CONSTRAINT "modifier_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_locations" ADD CONSTRAINT "combo_locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_locations" ADD CONSTRAINT "combo_locations_combo_item_id_fkey" FOREIGN KEY ("combo_item_id") REFERENCES "combo_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_locations" ADD CONSTRAINT "combo_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "category_relationships_parent_subcategory_unique" RENAME TO "category_relationships_parent_category_id_subcategory_id_key";
