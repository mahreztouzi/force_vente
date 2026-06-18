// deliverySlice.js - Slice avec actions synchrones pour mises à jour immédiates
import { createSlice } from "@reduxjs/toolkit";
import { processDeliveryComplete, resetDeliveryProcess } from "./outboundSlice";

const initialState = {
  // ... autres états existants
  deliveryProcess: {
    steps: {
      creation: { status: "pending", error: null, message: null },
      validation: { status: "pending", error: null, message: null },
      sortie: { status: "pending", error: null, message: null },
      facture: { status: "pending", error: null, message: null },
    },
    currentStep: 0,
    isComplete: false,
    offline: false,
    isProcessing: false,
    error: null,
    deliveryDocumentNumber: null,
    billDocumentNumber: null,
  },
};

const processDeliverySlice = createSlice({
  name: "deliveries",
  initialState,
  reducers: {
    // Action synchrone pour mise à jour immédiate des étapes
    updateStepStatus: (state, action) => {
      const {
        step,
        status,
        error,
        message,
        currentStep,
        isComplete,
        isProcessing,
        offline,
        deliveryDocumentNumber,
        billDocumentNumber,
      } = action.payload;

      console.log(`📊 Updating step ${step} to ${status}:`, action.payload);

      // Mise à jour de l'étape spécifique
      if (step && state.deliveryProcess.steps[step]) {
        state.deliveryProcess.steps[step].status = status;
        if (error !== undefined)
          state.deliveryProcess.steps[step].error = error;
        if (message !== undefined)
          state.deliveryProcess.steps[step].message = message;
      }

      // Mise à jour des numéros de documents
      if (deliveryDocumentNumber) {
        state.deliveryProcess.deliveryDocumentNumber = deliveryDocumentNumber;
      }
      if (billDocumentNumber) {
        state.deliveryProcess.billDocumentNumber = billDocumentNumber;
      }

      // Mise à jour des propriétés globales si fournies
      if (currentStep !== undefined)
        state.deliveryProcess.currentStep = currentStep;
      if (isComplete !== undefined)
        state.deliveryProcess.isComplete = isComplete;
      if (isProcessing !== undefined)
        state.deliveryProcess.isProcessing = isProcessing;
      if (offline !== undefined) state.deliveryProcess.offline = offline;
    },

    // Action pour terminer le processus en mode offline
    completeOfflineProcess: (state, action) => {
      console.log("📱 Completing offline process:", action.payload);

      state.deliveryProcess.steps.creation.status = "completed";
      state.deliveryProcess.steps.creation.message = action.payload.message;
      state.deliveryProcess.offline = true;
      state.deliveryProcess.isComplete = true;
      state.deliveryProcess.isProcessing = false;
      state.deliveryProcess.currentStep = 4; // Toutes les étapes sont "sautées" en offline
    },

    // Action pour réinitialiser avec erreur
    resetProcessWithError: (state, action) => {
      console.log("❌ Resetting process with error:", action.payload);

      state.deliveryProcess = {
        steps: {
          creation: {
            status: "error",
            error: action.payload.error,
            message: null,
          },
          validation: { status: "pending", error: null, message: null },
          sortie: { status: "pending", error: null, message: null },
          facture: { status: "pending", error: null, message: null },
        },
        currentStep: 0,
        isComplete: false,
        offline: false,
        isProcessing: false,
        error: action.payload.error,
        deliveryDocumentNumber: null,
        billDocumentNumber: null,
      };
    },

    // Action pour réinitialiser complètement
    resetProcess: (state) => {
      console.log("🔄 Resetting delivery process");

      state.deliveryProcess = {
        steps: {
          creation: { status: "pending", error: null, message: null },
          validation: { status: "pending", error: null, message: null },
          sortie: { status: "pending", error: null, message: null },
          facture: { status: "pending", error: null, message: null },
        },
        currentStep: 0,
        isComplete: false,
        offline: false,
        isProcessing: false,
        error: null,
        deliveryDocumentNumber: null,
        billDocumentNumber: null,
      };
    },

    // Action pour nettoyer les erreurs
    clearDeliveryProcessError: (state) => {
      state.deliveryProcess.error = null;
      // Nettoyer aussi les erreurs des étapes
      Object.keys(state.deliveryProcess.steps).forEach((stepKey) => {
        state.deliveryProcess.steps[stepKey].error = null;
      });
    },

    // Action pour démarrer le processus
    startDeliveryProcess: (state) => {
      console.log("🚀 Starting delivery process");

      state.deliveryProcess.isProcessing = true;
      state.deliveryProcess.error = null;
      state.deliveryProcess.isComplete = false;

      // Réinitialiser toutes les étapes
      Object.keys(state.deliveryProcess.steps).forEach((stepKey) => {
        state.deliveryProcess.steps[stepKey] = {
          status: "pending",
          error: null,
          message: null,
        };
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Gestion du processus de livraison complet
      .addCase(processDeliveryComplete.pending, (state) => {
        console.log("🔄 Process delivery PENDING");
        state.deliveryProcess.isProcessing = true;
        state.deliveryProcess.error = null;
      })
      .addCase(processDeliveryComplete.fulfilled, (state, action) => {
        console.log("✅ Process delivery FULFILLED", action.payload);
        // Le processus est terminé, mais les mises à jour ont été faites via les actions synchrones
        state.deliveryProcess.error = null;
      })
      .addCase(processDeliveryComplete.rejected, (state, action) => {
        console.log("❌ Process delivery REJECTED", action.payload);
        state.deliveryProcess.isProcessing = false;
        state.deliveryProcess.error =
          action.payload?.error || action.error.message;
      })

      // Gestion de la réinitialisation
      .addCase(resetDeliveryProcess.fulfilled, (state) => {
        console.log("🔄 Reset process FULFILLED");
        // La réinitialisation a été faite via l'action synchrone
      });
  },
});

// Export des actions
export const {
  updateStepStatus,
  completeOfflineProcess,
  resetProcessWithError,
  resetProcess,
  clearDeliveryProcessError,
  startDeliveryProcess,
} = processDeliverySlice.actions;

export default processDeliverySlice.reducer;

// Sélecteurs
export const selectDeliveryProcess = (state) => {
  return state.deliveries?.deliveryProcess;
};

export const selectDeliveryProcessSteps = (state) => {
  const process = selectDeliveryProcess(state);
  return process?.steps || {};
};

export const selectDeliveryCurrentStep = (state) => {
  const process = selectDeliveryProcess(state);
  return process?.currentStep || 0;
};

export const selectIsDeliveryProcessing = (state) => {
  const process = selectDeliveryProcess(state);
  return process?.isProcessing || false;
};

export const selectDeliveryProcessError = (state) => {
  const process = selectDeliveryProcess(state);
  return process?.error;
};

export const selectIsDeliveryComplete = (state) => {
  const process = selectDeliveryProcess(state);
  return process?.isComplete || false;
};

export const selectIsOfflineMode = (state) => {
  const process = selectDeliveryProcess(state);
  return process?.offline || false;
};

export const selectBillDocumentNumber = (state) => {
  const process = selectDeliveryProcess(state);
  return process?.billDocumentNumber;
};
