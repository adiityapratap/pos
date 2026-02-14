-- CreateTable: Junction table for many-to-many category relationships
CREATE TABLE "category_relationships" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "parent_category_id" UUID NOT NULL,
    "subcategory_id" UUID NOT NULL,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "category_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_category_relationships_parent" ON "category_relationships"("parent_category_id");
CREATE INDEX "idx_category_relationships_subcategory" ON "category_relationships"("subcategory_id");
CREATE INDEX "idx_category_relationships_tenant" ON "category_relationships"("tenant_id");
CREATE UNIQUE INDEX "category_relationships_parent_subcategory_unique" ON "category_relationships"("parent_category_id", "subcategory_id");

-- AddForeignKey
ALTER TABLE "category_relationships" ADD CONSTRAINT "category_relationships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "category_relationships" ADD CONSTRAINT "category_relationships_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "category_relationships" ADD CONSTRAINT "category_relationships_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
