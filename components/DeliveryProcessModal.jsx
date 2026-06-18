import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Modalize } from "react-native-modalize";
import { MaterialIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  resetProcess,
  selectDeliveryProcess,
} from "../redux/slices/processDeliverySlice";

const { width, height } = Dimensions.get("window");

const DeliveryProcessModal = forwardRef(
  ({ orderNumber, onPrintDelivery, onClose }, ref) => {
    const [showProcessModal, setShowProcessModal] = useState(false);
    const modalizeRef = useRef(null);

    // Récupérer l'état du processus depuis Redux avec logs de debug
    const deliveryProcess = useSelector((state) => {
      const process = selectDeliveryProcess(state);
      console.log("📱 Delivery Process State:", process);
      return process;
    });

    // Transformer les données Redux en format compatible avec le composant
    const processSteps = React.useMemo(() => {
      if (!deliveryProcess?.steps) {
        console.warn("⚠️ No delivery process steps found");
        return [];
      }

      return [
        {
          id: "creation",
          label: "Création de la livraison",
          status: deliveryProcess.steps.creation?.status || "pending",
          error: deliveryProcess.steps.creation?.error,
          message: deliveryProcess.steps.creation?.message,
        },
        {
          id: "validation",
          label: "Validation des quantités",
          status: deliveryProcess.steps.validation?.status || "pending",
          error: deliveryProcess.steps.validation?.error,
          message: deliveryProcess.steps.validation?.message,
        },
        {
          id: "sortie",
          label: "Sortie de marchandise",
          status: deliveryProcess.steps.sortie?.status || "pending",
          error: deliveryProcess.steps.sortie?.error,
          message: deliveryProcess.steps.sortie?.message,
        },
        {
          id: "facture",
          label: "Facturation",
          status: deliveryProcess.steps.facture?.status || "pending",
          error: deliveryProcess.steps.facture?.error,
          message: deliveryProcess.steps.facture?.message,
        },
      ];
    }, [deliveryProcess?.steps]);

    const currentStep = deliveryProcess?.currentStep || 0;

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      open: () => {
        console.log("🚀 Opening delivery process modal");
        setShowProcessModal(true);
        modalizeRef.current?.open();
      },
      close: closeProcessModal,
    }));

    // Fonction pour fermer le modal de processus
    const closeProcessModal = async () => {
      console.log("🔒 Closing delivery process modal");
      modalizeRef.current?.close();
      setShowProcessModal(false);
      await Dispatch(resetProcess());
    };

    // Effet pour surveiller la fin du processus
    useEffect(() => {
      if (deliveryProcess?.isComplete && showProcessModal) {
        console.log("✅ Processus de livraison terminé");
      }
    }, [deliveryProcess?.isComplete, showProcessModal]);

    // Composant pour afficher une étape
    const StepItem = ({ step, isActive, isCompleted }) => {
      // Au début du composant StepItem
      console.log("Step data:", step);
      console.log("Step message type:", typeof step.message, step.message);
      console.log("Step error type:", typeof step.error, step.error);
      const getStepIcon = () => {
        switch (step.status) {
          case "completed":
            return (
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            );
          case "in-progress":
            return <ActivityIndicator size={24} color="#03A9F4" />;
          case "error":
            return <MaterialIcons name="error" size={24} color="#F44336" />;
          default:
            return (
              <MaterialIcons
                name="radio-button-unchecked"
                size={24}
                color="#E0E0E0"
              />
            );
        }
      };

      const getStepStyle = () => {
        const baseStyle = defaultStyles.stepItem;
        switch (step.status) {
          case "completed":
            return [baseStyle, defaultStyles.stepCompleted];
          case "in-progress":
            return [baseStyle, defaultStyles.stepInProgress];
          case "error":
            return [baseStyle, defaultStyles.stepError];
          default:
            return [baseStyle, defaultStyles.stepPending];
        }
      };

      return (
        <View style={getStepStyle()}>
          <View style={defaultStyles.stepIconContainer}>{getStepIcon()}</View>
          <View style={defaultStyles.stepContent}>
            <Text
              style={[
                defaultStyles.stepLabel,
                step.status === "error" && defaultStyles.errorText,
              ]}
            >
              {step.label}
            </Text>
            {step.status === "in-progress" && (
              <Text style={defaultStyles.stepProgress}>En cours...</Text>
            )}
            {step.status === "completed" && (
              <>
                {step.message && (
                  <Text style={defaultStyles.stepSuccess}>{step.message}</Text>
                )}
                <Text style={defaultStyles.stepSuccess}>Terminé ✓</Text>
              </>
            )}
            {step.status === "error" && step.error && (
              <Text style={defaultStyles.stepErrorText}>{step.error}</Text>
            )}
          </View>
        </View>
      );
    };

    const completedSteps = processSteps?.filter(
      (s) => s.status === "completed"
    ).length;
    const allStepsCompleted = deliveryProcess?.isComplete;

    return (
      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        modalStyle={defaultStyles.modalContainer}
        withHandle={false}
        disableScrollIfPossible
        closeOnOverlayTap={false}
        onOverlayPress={false}
        onClosed={() => setShowProcessModal(false)}
        panGestureEnabled={false}
      >
        <View style={defaultStyles.processModal}>
          <View style={defaultStyles.processHeader}>
            <MaterialIcons name="local-shipping" size={32} color="#03A9F4" />
            <Text style={defaultStyles.processTitle}>
              Processus de livraison
            </Text>
            <Text style={defaultStyles.processSubtitle}>
              Commande N° {orderNumber}
            </Text>
            {deliveryProcess?.offline && (
              <Text style={defaultStyles.offlineIndicator}>
                📱 Mode hors ligne
              </Text>
            )}
          </View>

          <View style={defaultStyles.stepsContainer}>
            {processSteps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                isActive={index === currentStep}
                isCompleted={step.status === "completed"}
              />
            ))}
          </View>

          {/* Barre de progression */}
          <View style={defaultStyles.progressBarContainer}>
            <View style={defaultStyles.progressBarBackground}>
              <View
                style={[
                  defaultStyles.progressBarFill,
                  {
                    width: `${
                      (completedSteps / Math.max(processSteps.length, 1)) * 100
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={defaultStyles.progressText}>
              {completedSteps} / {processSteps.length} étapes terminées
            </Text>
          </View>

          {/* Indicateur de traitement */}
          {deliveryProcess?.isProcessing && !allStepsCompleted && (
            <View style={defaultStyles.processingIndicator}>
              <ActivityIndicator size="small" color="#03A9F4" />
              <Text style={defaultStyles.processingText}>
                Traitement en cours...
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={defaultStyles.processActions}>
            {allStepsCompleted && (
              <>
                {onPrintDelivery && deliveryProcess?.deliveryDocumentNumber ? (
                  <>
                    <TouchableOpacity
                      style={[
                        defaultStyles.processButton,
                        defaultStyles.printButton,
                      ]}
                      onPress={onPrintDelivery}
                      disabled={!deliveryProcess?.deliveryDocumentNumber}
                    >
                      <MaterialIcons name="print" size={18} color="white" />
                      <Text style={defaultStyles.processButtonText}>
                        Imprimer
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        defaultStyles.processButton,
                        defaultStyles.closeButton,
                      ]}
                      onPress={() => {
                        closeProcessModal();
                        onClose?.();
                      }}
                    >
                      <MaterialIcons name="close" size={20} color="white" />
                      <Text style={defaultStyles.processButtonText}>
                        Fermer
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[
                      defaultStyles.processButtonUniqueClose,
                      defaultStyles.closeButton,
                      {
                        width: "100%",
                      },
                    ]}
                    onPress={() => {
                      closeProcessModal();
                      onClose?.();
                    }}
                  >
                    <MaterialIcons name="close" size={20} color="white" />
                    <Text style={defaultStyles.processButtonText}>Fermer</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modalize>
    );
  }
);

// Styles par défaut (inchangés)
const defaultStyles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    minHeight: "80%",
  },
  processModal: {
    padding: 20,
  },
  processHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  processTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  processSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  offlineIndicator: {
    fontSize: 12,
    color: "#FF9800",
    marginTop: 4,
    fontWeight: "500",
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepPending: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  stepInProgress: {
    backgroundColor: "#E3F2FD",
    borderColor: "#03A9F4",
  },
  stepCompleted: {
    backgroundColor: "#E8F5E8",
    borderColor: "#4CAF50",
  },
  stepError: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  stepIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  stepProgress: {
    fontSize: 12,
    color: "#03A9F4",
    marginTop: 2,
  },
  stepSuccess: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 2,
  },
  stepErrorText: {
    fontSize: 12,
    color: "#F44336",
    marginTop: 2,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  processingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#03A9F4",
  },
  processActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  processActionsClose: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  processButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  processButtonUniqueClose: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: "center",
    width: "100%",
  },
  printButton: {
    backgroundColor: "#4CAF50",
    width: "65%",
    marginRight: 10,
  },
  closeButton: {
    backgroundColor: "#666",
  },
  processButtonText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 6,
  },
  errorText: {
    color: "#F44336",
  },
});

export default DeliveryProcessModal;
