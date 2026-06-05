
import { ADMIN_BRAND_ADD, ADMIN_BRAND_SHOW, ADMIN_CATEGORY_ADD, ADMIN_CATEGORY_SHOW, ADMIN_COUPON_ADD, ADMIN_COUPON_SHOW, ADMIN_CUSTOMERS_SHOW, ADMIN_CUSTOMER_GROUPS_SHOW, ADMIN_DASHBOARD, ADMIN_INVENTORY_SHOW, ADMIN_MAINTENANCE_SHOW, ADMIN_MEDIA_SHOW, ADMIN_ORDER_SHOW, ADMIN_PRODUCT_ADD, ADMIN_PRODUCT_SHOW, ADMIN_REVIEW_SHOW, ADMIN_ROLES_SHOW } from "@/routes/AdminPanelRoute";

const searchData = [
    {
        label: "Dashboard",
        description: "View website analytics and reports",
        url: ADMIN_DASHBOARD,
        keywords: ["dashboard", "overview", "analytics", "insights"]
    },
    {
        label: "Category",
        description: "Manage product categories",
        url: ADMIN_CATEGORY_SHOW,
        keywords: ["category", "product category"]
    },
    {
        label: "Add Category",
        description: "Add new product categories",
        url: ADMIN_CATEGORY_ADD,
        keywords: ["add category", "new category"]
    },
    {
        label: "Product",
        description: "Manage all product listings",
        url: ADMIN_PRODUCT_SHOW,
        keywords: ["products", "product list"]
    },
    {
        label: "Add Product",
        description: "Add a new product to the catalog",
        url: ADMIN_PRODUCT_ADD,
        keywords: ["new product", "add product"]
    },
    {
        label: "Brands",
        description: "Manage product brands",
        url: ADMIN_BRAND_SHOW,
        keywords: ["brands", "manufacturer"]
    },
    {
        label: "Add Brand",
        description: "Add a new brand",
        url: ADMIN_BRAND_ADD,
        keywords: ["new brand", "add brand"]
    },
    {
        label: "Inventory",
        description: "Stock levels per variant",
        url: ADMIN_INVENTORY_SHOW,
        keywords: ["inventory", "stock", "warehouse"]
    },
    {
        label: "Coupon",
        description: "Manage active discount coupons",
        url: ADMIN_COUPON_SHOW,
        keywords: ["discount", "promo", "coupon"]
    },
    {
        label: "Add Coupon",
        description: "Create a new discount coupon",
        url: ADMIN_COUPON_ADD,
        keywords: ["add coupon", "new coupon", "promotion", "offers"]
    },
    {
        label: "Orders",
        description: "Manage customer orders",
        url: ADMIN_ORDER_SHOW,
        keywords: ["orders"]
    },
    {
        label: "Customers",
        description: "View and manage customer information",
        url: ADMIN_CUSTOMERS_SHOW,
        keywords: ["customers", "users"]
    },
    {
        label: "Customer Groups",
        description: "Tiers like retail / wholesale / VIP",
        url: ADMIN_CUSTOMER_GROUPS_SHOW,
        keywords: ["customer groups", "tiers", "wholesale", "vip", "retail"]
    },
    {
        label: "Roles & Permissions",
        description: "Manage admin roles and permissions",
        url: ADMIN_ROLES_SHOW,
        keywords: ["roles", "permissions", "rbac", "access"]
    },
    {
        label: "Review",
        description: "Manage customer reviews and feedback",
        url: ADMIN_REVIEW_SHOW,
        keywords: ["ratings", "feedback"]
    },
    {
        label: "Media",
        description: "Manage website media files",
        url: ADMIN_MEDIA_SHOW,
        keywords: ["images", "videos"]
    },
    {
        label: "Maintenance",
        description: "Run migrations and seeders",
        url: ADMIN_MAINTENANCE_SHOW,
        keywords: ["maintenance", "migration", "seed", "rbac", "publicid"]
    },
];

export default searchData;


