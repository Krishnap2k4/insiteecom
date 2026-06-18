import { AiOutlineDashboard } from "react-icons/ai";
import { LuSettings } from "react-icons/lu";
import { BiCategory } from "react-icons/bi";
import { IoShirtOutline } from "react-icons/io5";
import { MdOutlineShoppingBag, MdOutlineInventory2, MdOutlineBuild, MdOutlineVideoLibrary } from "react-icons/md";
import { LuUserRound, LuShieldCheck, LuTag } from "react-icons/lu";
import { IoMdStarOutline } from "react-icons/io";
import { MdOutlinePermMedia } from "react-icons/md";
import { RiCoupon2Line } from "react-icons/ri";
import { FiMessageSquare } from "react-icons/fi";
import { ADMIN_BRAND_ADD, ADMIN_BRAND_SHOW, ADMIN_CAMPAIGN_ADD, ADMIN_CAMPAIGN_SHOW, ADMIN_CATEGORY_ADD, ADMIN_CATEGORY_SHOW, ADMIN_CMS, ADMIN_CONTACTS_SHOW, ADMIN_COUPON_ADD, ADMIN_COUPON_SHOW, ADMIN_CUSTOMERS_SHOW, ADMIN_CUSTOMER_GROUPS_ADD, ADMIN_CUSTOMER_GROUPS_SHOW, ADMIN_DASHBOARD, ADMIN_EMAIL_TEMPLATES_SHOW, ADMIN_INVENTORY_SHOW, ADMIN_MAINTENANCE_SHOW, ADMIN_MEDIA_SHOW, ADMIN_NEWSLETTER_SHOW, ADMIN_ORDER_SHOW, ADMIN_PRODUCT_ADD, ADMIN_PRODUCT_SHOW, ADMIN_REFUND_SHOW, ADMIN_RETURN_SHOW, ADMIN_REVIEW_SHOW, ADMIN_ROLES_SHOW, ADMIN_SETTINGS, ADMIN_SHIPMENT_SHOW, ADMIN_SHOP_THE_LOOK_ADD, ADMIN_SHOP_THE_LOOK_SHOW, ADMIN_SUPPORT_SHOW } from "@/routes/AdminPanelRoute";


export const adminAppSidebarMenu = [
    {
        title: "Dashboard",
        url: ADMIN_DASHBOARD,
        icon: AiOutlineDashboard
    },
    {
        title: "Category",
        url: "#",
        icon: BiCategory,
        submenu: [
            {
                title: "Add Category",
                url: ADMIN_CATEGORY_ADD
            },
            {
                title: "All Category",
                url: ADMIN_CATEGORY_SHOW
            }
        ]
    },
    {
        title: "Products",
        url: "#",
        icon: IoShirtOutline,
        submenu: [
            {
                title: "Add Product",
                url: ADMIN_PRODUCT_ADD
            },
            {
                title: "All Products",
                url: ADMIN_PRODUCT_SHOW
            },
        ]
    },
    {
        title: "Brands",
        url: "#",
        icon: LuTag,
        submenu: [
            {
                title: "Add Brand",
                url: ADMIN_BRAND_ADD,
            },
            {
                title: "All Brands",
                url: ADMIN_BRAND_SHOW,
            },
        ],
    },
    {
        title: "Inventory",
        url: ADMIN_INVENTORY_SHOW,
        icon: MdOutlineInventory2,
    },
    {
        title: "Marketing",
        url: "#",
        icon: RiCoupon2Line,
        submenu: [
            { title: "Coupons", url: ADMIN_COUPON_SHOW },
            { title: "Add Coupon", url: ADMIN_COUPON_ADD },
            { title: "Campaigns", url: ADMIN_CAMPAIGN_SHOW },
            { title: "Add Campaign", url: ADMIN_CAMPAIGN_ADD },
            { title: "Newsletter", url: ADMIN_NEWSLETTER_SHOW },
        ],
    },
    {
        title: "Support",
        url: '#',
        icon: FiMessageSquare,
        submenu: [
            { title: "Inbox", url: ADMIN_SUPPORT_SHOW },
            { title: "Contact submissions", url: ADMIN_CONTACTS_SHOW },
            { title: "Email templates", url: ADMIN_EMAIL_TEMPLATES_SHOW },
        ],
    },
    {
        title: "Orders",
        url: '#',
        icon: MdOutlineShoppingBag,
        submenu: [
            { title: "All Orders", url: ADMIN_ORDER_SHOW },
            { title: "Shipments", url: ADMIN_SHIPMENT_SHOW },
            { title: "Refunds", url: ADMIN_REFUND_SHOW },
            { title: "Returns", url: ADMIN_RETURN_SHOW },
        ],
    },
    {
        title: "Customers",
        url: "#",
        icon: LuUserRound,
        submenu: [
            {
                title: "All Customers",
                url: ADMIN_CUSTOMERS_SHOW,
            },
            {
                title: "Customer Groups",
                url: ADMIN_CUSTOMER_GROUPS_SHOW,
            },
            {
                title: "Add Customer Group",
                url: ADMIN_CUSTOMER_GROUPS_ADD,
            },
        ],
    },
    {
        title: "Roles & Permissions",
        url: ADMIN_ROLES_SHOW,
        icon: LuShieldCheck,
    },
    {
        title: "Reviews",
        url: ADMIN_REVIEW_SHOW,
        icon: IoMdStarOutline,
    },
    {
        title: "Media",
        url: ADMIN_MEDIA_SHOW,
        icon: MdOutlinePermMedia,
    },
    {
        // Content / CMS group — everything customer-facing.
        // Settings holds business rules (shipping, etc.) instead.
        title: "Content",
        url: "#",
        icon: MdOutlineVideoLibrary,
        submenu: [
            { title: "Site Content", url: ADMIN_CMS },
            { title: "Shop the Look", url: ADMIN_SHOP_THE_LOOK_SHOW },
            { title: "Add Video", url: ADMIN_SHOP_THE_LOOK_ADD },
        ],
    },
    {
        title: "Maintenance",
        url: ADMIN_MAINTENANCE_SHOW,
        icon: MdOutlineBuild,
    },
    {
        title: "Settings",
        url: ADMIN_SETTINGS,
        icon: LuSettings,
    },
]