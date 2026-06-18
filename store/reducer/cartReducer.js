import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from '@/lib/apiClient'

/**
 * Server-persisted cart slice. The Redux store is a cache of the
 * server cart — every mutating action POSTs to /api/cart/* and
 * replaces the local cache with the server's response.
 *
 * Item shape (read-side):
 *   {
 *     productId, variantId, name, slug, publicId, sku,
 *     mrp, sellingPrice, media,
 *     optionValues[], color, size,
 *     qty, stock, unavailable, unavailableReason,
 *   }
 *
 * Item shape (write-side): only `productId` + `variantId` + `qty` go
 * to the server; the server rehydrates the rest.
 */
const initialState = {
    id: null,
    products: [],
    count: 0,
    subtotal: 0,
    discount: 0,
    shippingAmount: 0,
    couponCode: null,
    currency: 'INR',
    loading: false,
    error: null,
    hydrated: false,
}

const applyServerCart = (state, payload) => {
    if (!payload) return
    state.id = payload.id || null
    state.products = payload.items || []
    state.count = payload.count ?? (payload.items?.reduce((s, i) => s + i.qty, 0) || 0)
    state.subtotal = payload.subtotal || 0
    state.discount = payload.discount || 0
    state.shippingAmount = payload.shippingAmount || 0
    state.couponCode = payload.couponCode || null
    state.currency = payload.currency || 'INR'
    state.hydrated = true
}

export const fetchCart = createAsyncThunk('cart/fetch', async () => {
    const { data: res } = await axios.get('/api/cart')
    if (!res?.success) throw new Error(res?.message || 'Failed to fetch cart')
    return res.data
})

export const addToCartAsync = createAsyncThunk(
    'cart/add',
    async ({ productId, variantId, qty = 1 }) => {
        const { data: res } = await axios.post('/api/cart/add', { productId, variantId, qty })
        if (!res?.success) throw new Error(res?.message || 'Failed to add to cart')
        return res.data
    }
)

export const updateCartQty = createAsyncThunk(
    'cart/update',
    async ({ variantId, qty }) => {
        const { data: res } = await axios.put('/api/cart/update', { variantId, qty })
        if (!res?.success) throw new Error(res?.message || 'Failed to update cart')
        return res.data
    }
)

export const removeFromCartAsync = createAsyncThunk(
    'cart/remove',
    async ({ variantId }) => {
        const { data: res } = await axios.post('/api/cart/remove', { variantId })
        if (!res?.success) throw new Error(res?.message || 'Failed to remove')
        return res.data
    }
)

export const clearCartAsync = createAsyncThunk('cart/clear', async () => {
    const { data: res } = await axios.post('/api/cart/clear')
    if (!res?.success) throw new Error(res?.message || 'Failed to clear cart')
    return res.data
})

export const applyCartCoupon = createAsyncThunk(
    'cart/coupon',
    async ({ code }) => {
        const { data: res } = await axios.post('/api/cart/coupon', { code })
        if (!res?.success) throw new Error(res?.message || 'Failed to update coupon')
        return res.data
    }
)

export const mergeGuestCart = createAsyncThunk('cart/merge', async () => {
    const { data: res } = await axios.post('/api/cart/merge')
    if (!res?.success) throw new Error(res?.message || 'Failed to merge cart')
    // After a successful merge the user cart is the source of truth — refetch.
    const { data: fresh } = await axios.get('/api/cart')
    if (!fresh?.success) throw new Error(fresh?.message || 'Failed to refresh cart')
    return fresh.data
})

export const cartReducer = createSlice({
    name: 'cartStore',
    initialState,
    reducers: {
        resetCart: () => initialState,
    },
    extraReducers: (builder) => {
        const successCases = [
            fetchCart, addToCartAsync, updateCartQty, removeFromCartAsync,
            clearCartAsync, applyCartCoupon, mergeGuestCart,
        ]
        for (const thunk of successCases) {
            builder.addCase(thunk.pending, (state) => {
                state.loading = true
                state.error = null
            })
            builder.addCase(thunk.fulfilled, (state, action) => {
                state.loading = false
                applyServerCart(state, action.payload)
            })
            builder.addCase(thunk.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Cart error'
            })
        }
    },
})

export const { resetCart } = cartReducer.actions
export default cartReducer.reducer
