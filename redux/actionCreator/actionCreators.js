// src/redux/actionCreator/actionCreators.js - Version corrigée
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrder,
  deleteOrderItemService,
  updateOrderItemService,
  addOrderItemService,
  createOrderReturn,
} from "../../services/orderService";
import { completeDeliveryProcess } from "../../services/outboundService";
import { createBill } from "../../services/billService";
import { creatGoodReceipt } from "../../services/transfertService";
import {
  createEncaissement,
  deleteEncaissements,
  putEncaissement,
} from "../../services/encaissementService";
import { createQuotation } from "../../services/quotationService";
import { processDeliveryComplete } from "../slices/outboundSlice";

/**
 * Map specific action types to their recreation functions
 * This helps handle special cases for different action types
 */
export const actionCreators = {
  // Pour l'action addOrder, nous devons appeler directement l'API au lieu de dispatcher l'action
  "orders/addOrder": (payload, meta = {}) => {
    return async (dispatch, getState) => {
      try {
        console.log(
          "[SYNC] Recréation de l'action orders/addOrder avec payload:",
          payload
        );

        // Dispatch pending
        dispatch({
          type: "orders/addOrder/pending",
          meta: { bypassOfflineQueue: true },
        });

        // IMPORTANT: Appeler directement l'API au lieu de dispatcher l'action
        const response = await createOrder(payload);

        console.log("[SYNC] Réponse API de orders/addOrder:", response);

        // Dispatch fulfilled avec la réponse de l'API
        dispatch({
          type: "orders/addOrder/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        console.error(
          "[SYNC] Erreur lors de la recréation de orders/addOrder:",
          error
        );

        // Dispatch rejected
        dispatch({
          type: "orders/addOrder/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });

        throw error;
      }
    };
  },
  "orders/addOrderReturn": (payload, meta = {}) => {
    return async (dispatch, getState) => {
      try {
        console.log(
          "[SYNC] Recréation de l'action orders/addOrderReturn avec payload:",
          payload
        );

        // Dispatch pending
        dispatch({
          type: "orders/addOrderReturn/pending",
          meta: { bypassOfflineQueue: true },
        });

        // IMPORTANT: Appeler directement l'API au lieu de dispatcher l'action
        const response = await createOrderReturn(payload);

        console.log("[SYNC] Réponse API de orders/addOrder:", response);

        // Dispatch fulfilled avec la réponse de l'API
        dispatch({
          type: "orders/addOrderReturn/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        console.error(
          "[SYNC] Erreur lors de la recréation de orders/addOrder:",
          error
        );

        // Dispatch rejected
        dispatch({
          type: "orders/addOrderReturn/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });

        throw error;
      }
    };
  },

  // Implémentation similaire pour les autres actions qui nécessitent un appel API direct
  "orders/deleteOrderItem": (payload, meta = {}) => {
    return async (dispatch) => {
      try {
        dispatch({
          type: "orders/deleteOrderItem/pending",
          meta: { bypassOfflineQueue: true },
        });

        // Appel direct à l'API
        const { commande, itemNumber } = payload;
        const response = await deleteOrderItemService(commande, itemNumber);

        dispatch({
          type: "orders/deleteOrderItem/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        dispatch({
          type: "orders/deleteOrderItem/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });
        throw error;
      }
    };
  },

  "orders/updateOrderItem": (payload, meta = {}) => {
    return async (dispatch) => {
      try {
        dispatch({
          type: "orders/updateOrderItem/pending",
          meta: { bypassOfflineQueue: true },
        });

        // Appel direct à l'API
        const { commande, itemNumber, article, qte } = payload;
        const response = await updateOrderItemService(
          commande,
          itemNumber,
          article,
          qte
        );

        dispatch({
          type: "orders/updateOrderItem/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        dispatch({
          type: "orders/updateOrderItem/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });
        throw error;
      }
    };
  },

  "orders/addOrderItem": (payload, meta = {}) => {
    return async (dispatch) => {
      try {
        dispatch({
          type: "orders/addOrderItem/pending",
          meta: { bypassOfflineQueue: true },
        });

        // Appel direct à l'API
        const { commande, article, qte } = payload;
        const response = await addOrderItemService(commande, article, qte);

        dispatch({
          type: "orders/addOrderItem/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        dispatch({
          type: "orders/addOrderItem/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });
        throw error;
      }
    };
  },
  "outbounds/addOutbound": (payload, meta = {}) => {
    return async (dispatch) => {
      try {
        dispatch({
          type: "outbounds/addOutbound/pending",
          meta: { bypassOfflineQueue: true },
        });

        const response = await completeDeliveryProcess(payload);

        dispatch({
          type: "outbounds/addOutbound/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        dispatch({
          type: "outbounds/addOutbound/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });
        throw error;
      }
    };
  },
  "outbound/deliveries/processDeliveryComplete": (payload, meta = {}) => {
    return async (dispatch) => {
      try {
        dispatch({
          type: "outbound/deliveries/processDeliveryComplete/pending",
          meta: { bypassOfflineQueue: true },
        });

        const response = await completeDeliveryProcess(payload);

        dispatch({
          type: "outbound/deliveries/processDeliveryComplete/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        dispatch({
          type: "outbound/deliveries/processDeliveryComplete/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });
        throw error;
      }
    };
  },
  "bills/addBill": (payload, meta = {}) => {
    return async (dispatch) => {
      try {
        dispatch({
          type: "bills/addBill/pending",
          meta: { bypassOfflineQueue: true },
        });

        const response = await createBill(payload);

        dispatch({
          type: "bills/addBill/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        dispatch({
          type: "bills/addBill/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });
        throw error;
      }
    };
  },
  "goodReceipts/addGoodReceipt": (payload, meta = {}) => {
    return async (dispatch) => {
      try {
        dispatch({
          type: "goodReceipts/addGoodReceipt/pending",
          meta: { bypassOfflineQueue: true },
        });

        const response = await creatGoodReceipt(payload);

        dispatch({
          type: "goodReceipts/addGoodReceipt/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        dispatch({
          type: "goodReceipts/addGoodReceipt/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });
        throw error;
      }
    };
  },
  // les encaissments
  "encaissement/addEncaissement": (payload, meta = {}) => {
    return async (dispatch) => {
      try {
        dispatch({
          type: "encaissement/addEncaissement/pending",
          meta: { bypassOfflineQueue: true },
        });

        const response = await createEncaissement(payload);

        dispatch({
          type: "encaissement/addEncaissement/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        dispatch({
          type: "encaissement/addEncaissement/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });
        throw error;
      }
    };
  },
  "encaissement/deleteEncaissement": (payload, meta = {}) => {
    return async (dispatch) => {
      try {
        dispatch({
          type: "encaissement/deleteEncaissement/pending",
          meta: { bypassOfflineQueue: true },
        });
        const { client, commercial, numLigne } = payload;
        const response = await deleteEncaissements(
          client,
          commercial,
          numLigne
        );

        dispatch({
          type: "encaissement/deleteEncaissement/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        dispatch({
          type: "encaissement/deleteEncaissement/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });
        throw error;
      }
    };
  },
  "encaissement/modifyEncaissement": (payload, meta = {}) => {
    return async (dispatch) => {
      try {
        dispatch({
          type: "encaissement/modifyEncaissement/pending",
          meta: { bypassOfflineQueue: true },
        });

        const response = await putEncaissement(payload);

        dispatch({
          type: "encaissement/modifyEncaissement/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        dispatch({
          type: "encaissement/modifyEncaissement/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });
        throw error;
      }
    };
  },
  "Quotations/addQuotation": (payload, meta = {}) => {
    return async (dispatch, getState) => {
      try {
        console.log(
          "[SYNC] Recréation de l'action orders/addOrder avec payload:",
          payload
        );

        // Dispatch pending
        dispatch({
          type: "Quotations/addQuotation/pending",
          meta: { bypassOfflineQueue: true },
        });

        // IMPORTANT: Appeler directement l'API au lieu de dispatcher l'action
        const response = await createQuotation(payload);

        console.log("[SYNC] Réponse API de orders/addOrder:", response);

        // Dispatch fulfilled avec la réponse de l'API
        dispatch({
          type: "Quotations/addQuotation/fulfilled",
          payload: response,
          meta: { bypassOfflineQueue: true },
        });

        return { payload: response };
      } catch (error) {
        console.error(
          "[SYNC] Erreur lors de la recréation de orders/addOrder:",
          error
        );

        // Dispatch rejected
        dispatch({
          type: "Quotations/addQuotation/rejected",
          error: true,
          payload: error.message || "Erreur inconnue",
          meta: { bypassOfflineQueue: true },
        });

        throw error;
      }
    };
  },
};

/**
 * Get appropriate action creator function for a given action type
 * @param {string} actionType - The action type
 * @returns {Function} - The action creator function
 */
export const getActionCreator = (actionType) => {
  return actionCreators[actionType];
};
