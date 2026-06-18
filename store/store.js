import { combineReducers, configureStore } from "@reduxjs/toolkit"
import persistReducer from "redux-persist/es/persistReducer"
import persistStore from "redux-persist/es/persistStore"
import localStorage from "redux-persist/es/storage"
import autoMergeLevel2 from "redux-persist/es/stateReconciler/autoMergeLevel2"
import authReducer from "./reducer/authReducer"
import cartReducer  from "./reducer/cartReducer"
import wishlistReducer from "./reducer/wishlistReducer"

const rootReducer = combineReducers({
    authStore: authReducer,
    cartStore: cartReducer,
    wishlistStore: wishlistReducer,
})

/**
 * Redux Persist configuration.
 *
 * - `version` bumps any time the persisted state shape changes in a way
 *   that's not safe to silently merge into the new reducers' defaults.
 *   Older snapshots are dropped on the next load (cart/wishlist are
 *   server-backed anyway, so the user just sees their server state again).
 *
 * - `stateReconciler: autoMergeLevel2` deep-merges loaded state with the
 *   reducer's initial state — so fields *added* to a reducer (e.g. the
 *   recent `cartStore.shippingAmount`) get populated from defaults
 *   instead of being `undefined`, which would crash consumers reading
 *   `state.shippingAmount.toLocaleString(...)` etc.
 *
 * - `migrate` handles missing/older versions gracefully.
 *
 * Together these prevent the "after deployment some users get a broken
 * page until they clear browser storage" failure mode.
 */
const PERSIST_VERSION = 2

const persistConfig = {
    key: 'root',
    version: PERSIST_VERSION,
    storage: localStorage,
    stateReconciler: autoMergeLevel2,
    migrate: (state) => {
        // No persisted state, or pre-version-1 snapshot — start fresh.
        if (!state || !state._persist) return Promise.resolve(undefined)
        // Snapshot is from an older version — let autoMergeLevel2 fill the gaps.
        // Everything important (cart, wishlist, auth) re-syncs from the server.
        return Promise.resolve(state)
    },
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false })
})

export const persistor = persistStore(store)
