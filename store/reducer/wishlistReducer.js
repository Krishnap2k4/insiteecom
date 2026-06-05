import { createSlice } from '@reduxjs/toolkit'

/**
 * Lightweight wishlist slice — holds only the count for the header
 * badge and a "dirty" timestamp so listening components can refetch
 * their data after a mutation. The authoritative list lives on the
 * server (WishlistItem collection); we don't mirror it client-side
 * to keep the persisted redux blob small.
 */
const initialState = {
    count: 0,
    lastChange: 0,
}

const wishlistReducer = createSlice({
    name: 'wishlistStore',
    initialState,
    reducers: {
        setWishlistCount: (state, action) => {
            state.count = Math.max(0, Number(action.payload) || 0)
        },
        bumpWishlistChange: (state) => {
            state.lastChange = Date.now()
        },
        resetWishlist: (state) => {
            state.count = 0
            state.lastChange = Date.now()
        },
    },
})

export const { setWishlistCount, bumpWishlistChange, resetWishlist } = wishlistReducer.actions
export default wishlistReducer.reducer
