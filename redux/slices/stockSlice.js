// src/redux/slices/stockslice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchStockArticle } from "../../services/stockService";
import { isConnected } from "../../utils/offlineUtils";

const connectionCheckStarted = () => ({
  type: "stocks/connection/checkStarted",
});

// Créer un thunk pour récupérer les stocks
export const getstocks = createAsyncThunk(
  "stocks/getstocks",
  async ({ magasin }, { rejectWithValue, getState, dispatch }) => {
    // const stocks = await fetchStockArticle();
    // return stocks;
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();

      // If offline, try to use cached data from the store
      if (!isFullyConnected) {
        const cached = getState().stock.stocks;
        return cached;
      }
      const stocks = await fetchStockArticle(magasin);
      return stocks;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Créer le slice Redux
const stockSlice = createSlice({
  name: "stocks",
  initialState: {
    stocks: [],
    loadingStocks: false,
    errorStocks: null,
  },
  reducers: {
    // Action pour mettre à jour le stock lors d'une livraison offline
    updateStockAfterNotDelivery: (state, action) => {
      const { deliveryItems, ordersApprouve } = action.payload;

      // Parcourir chaque article livré
      deliveryItems.forEach((deliveryItem) => {
        const {
          ReferenceSDDocument,
          ReferenceSDDocumentItem,
          ActualDeliveryQuantity,
        } = deliveryItem;

        // Trouver l'article correspondant dans les commandes approuvées pour récupérer le lot
        const orderItem = ordersApprouve.find(
          (order) =>
            order.cmd === ReferenceSDDocument &&
            order.posnr === ReferenceSDDocumentItem
        );

        if (orderItem) {
          const { matnr: material, charg: lot } = orderItem;
          const quantityDelivered = parseFloat(ActualDeliveryQuantity);

          // Mettre à jour le stock pour cet article et ce lot spécifique
          state.stocks = state.stocks.map((stockItem) => {
            if (stockItem.Material === material && stockItem.lot === lot) {
              return {
                ...stockItem,
                AvailableStockByLot: Math.max(
                  0,
                  parseFloat(stockItem.AvailableStockByLot) + quantityDelivered
                ).toString(),
                // Optionnel: mettre à jour aussi le stock total si nécessaire
                AvailableStock: Math.max(
                  0,
                  parseFloat(stockItem.AvailableStock) + quantityDelivered
                ).toString(),
              };
            }
            return stockItem;
          });

          console.log(
            `Stock mis à jour: Article ${material}, Lot ${lot}, Quantité livrée: ${quantityDelivered}`
          );
        }
      });
    },
    updateStockAfterDelivery: (state, action) => {
      const { deliveryItems, ordersApprouve } = action.payload;

      // Parcourir chaque article livré
      deliveryItems.forEach((deliveryItem) => {
        const {
          ReferenceSDDocument,
          ReferenceSDDocumentItem,
          ActualDeliveryQuantity,
        } = deliveryItem;

        // Trouver l'article correspondant dans les commandes approuvées pour récupérer le lot
        const orderItem = ordersApprouve.find(
          (order) =>
            order.cmd === ReferenceSDDocument &&
            order.posnr === ReferenceSDDocumentItem
        );

        if (orderItem) {
          const { matnr: material, charg: lot } = orderItem;
          const quantityDelivered = parseFloat(ActualDeliveryQuantity);

          // Mettre à jour le stock pour cet article et ce lot spécifique
          state.stocks = state.stocks.map((stockItem) => {
            if (stockItem.Material === material && stockItem.lot === lot) {
              return {
                ...stockItem,
                AvailableStockByLot: Math.max(
                  0,
                  parseFloat(stockItem.AvailableStockByLot) - quantityDelivered
                ).toString(),
                // Optionnel: mettre à jour aussi le stock total si nécessaire
                AvailableStock: Math.max(
                  0,
                  parseFloat(stockItem.AvailableStock) - quantityDelivered
                ).toString(),
              };
            }
            return stockItem;
          });

          console.log(
            `Stock mis à jour: Article ${material}, Lot ${lot}, Quantité livrée: ${quantityDelivered}`
          );
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // .addCase("stocks/connection/checkStarted", (state) => {
      //   state.loadingStocks = true;
      // })
      .addCase(getstocks.pending, (state) => {
        state.loading = true;
        state.errorStocks = null;
      })
      .addCase(getstocks.fulfilled, (state, action) => {
        state.loadingStocks = false;
        state.stocks = action.payload; // Stocker les stocks dans l'état
      })
      .addCase(getstocks.rejected, (state, action) => {
        state.loadingStocks = false;
        state.errorStocks = action.error.message; // Gérer l'erreur
      });
  },
});
export const { updateStockAfterDelivery, updateStockAfterNotDelivery } =
  stockSlice.actions;
export default stockSlice.reducer;
