// src/redux/slices/billSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createBill } from "../../services/billService";
import { isConnected } from "../../utils/offlineUtils";
import { updateOutboundToBillsOfflineQueued } from "./outboundSlice";

export const connectionCheckStarted = () => ({
  type: "bills/connection/checkStarted",
});

// Thunk pour créer une commande
export const addBill = createAsyncThunk(
  "bills/addBill",
  async (billData, { rejectWithValue, dispatch }) => {
    try {
      dispatch(connectionCheckStarted());
      // const { connected } = await getStoredConnectionStatus();
      const isFullyConnected = await isConnected();
      // const isFullyConnected = await isConnected();
      if (!isFullyConnected) {
        dispatch(updateOutboundToBillsOfflineQueued(billData));
        console.log("je suis appelé dans cration bills ", isFullyConnected);
        return;
      }

      const bill = await createBill(billData);
      return bill;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Créer le slice Redux
const billSlice = createSlice({
  name: "bills",
  initialState: {
    bills: [],
    currentbill: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetBillState: (state) => {
      state.currentbill = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase("bills/connection/checkStarted", (state) => {
        state.loading = true;
      })
      // Cas pour la création d'une facture
      .addCase(addBill.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addBill.fulfilled, (state, action) => {
        state.loading = false;
        state.currentbill = action.payload;
        state.bills.push(action.payload);
        state.success = true;
      })
      .addCase(addBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetBillState } = billSlice.actions;
export default billSlice.reducer;
