import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  FlatList,
  Alert,
  Dimensions,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  BackHandler,
} from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Modalize } from "react-native-modalize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addOrder,
  addOrderReturn,
  getMotifsRetours,
} from "../redux/slices/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import CommandFloatingButton from "../components/CommandFloatingButton";
import { color } from "react-native-elements/dist/helpers";
import { addQuotation } from "../redux/slices/quotationSlice";

const { width } = Dimensions.get("window");
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

const BrouillonScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client } = route.params;
  const dispatch = useDispatch();
  const { motifs } = useSelector((state) => state.orders);
  const modalizeRef = useRef(null);
  const [activeTab, setActiveTab] = useState("commandes"); // 'commandes' ou 'notes'
  const [brouillonCommandes, setBrouillonCommandes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [editingNoteContent, setEditingNoteContent] = useState("");

  // Références pour les modales
  const commandeModalizeRef = useRef(null);
  const noteModalizeRef = useRef(null);

  // Clés AsyncStorage
  const DRAFT_ORDERS_KEY = "draft_orders";
  const DRAFT_NOTES_KEY = "draft_notes";

  useEffect(() => {
    dispatch(getMotifsRetours());
  }, [dispatch]);

  useEffect(() => {
    const handleBackPress = () => {
      // Comportement normal - retourner à l'écran précédent
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [navigation]);

  const handleReturnPress = () => {
    modalizeRef.current?.open();
  };

  const handleMotifSelect = (motif) => {
    modalizeRef.current?.close();
    navigation.navigate("brouillon_cmd", {
      client: route.params.client,
      type: "return",
      motif,
      isDraft: false, // Ajoutez ce flag si nécessaire
    });
  };

  const renderMotifItem = ({ item }) => (
    <TouchableOpacity
      style={styles.motifItem}
      onPress={() => handleMotifSelect(item)}
    >
      <Text style={styles.motifText}>{item.Bezei}</Text>
      <Text style={styles.motifCode}>Code: {item.Augru}</Text>
    </TouchableOpacity>
  );

  useFocusEffect(
    useCallback(() => {
      loadBrouillons();
    }, [])
  );

  // ✅ SOLUTION 2: Écouter les événements de navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadBrouillons();
    });

    return unsubscribe;
  }, [navigation]);

  // Charger les brouillons depuis AsyncStorage
  const loadBrouillons = async () => {
    try {
      setLoading(true);
      const [commandesData, notesData] = await Promise.all([
        AsyncStorage.getItem(DRAFT_ORDERS_KEY),
        AsyncStorage.getItem(DRAFT_NOTES_KEY),
      ]);

      if (commandesData) {
        const parsedCommandes = JSON.parse(commandesData);
        const commandesClient = parsedCommandes.filter(
          (cmd) => cmd.client.kunnr === client.kunnr
        );
        const sortedCommandes = commandesClient.sort(
          (a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt)
        );
        setBrouillonCommandes(sortedCommandes);
      } else {
        setBrouillonCommandes([]);
      }

      // CORRECTION: Récupération de toutes les notes et filtrage par client
      if (notesData) {
        const parsedNotes = JSON.parse(notesData);
        const notesClient = parsedNotes.filter(
          (note) => note.clientKunnr === client.kunnr // Correction ici
        );
        const sortedNotes = notesClient.sort(
          (a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt)
        );
        setNotes(sortedNotes);
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des brouillons:", error);
      Alert.alert("Erreur", "Impossible de charger les brouillons");
    } finally {
      setLoading(false);
    }
  };
  const forceRefresh = async () => {
    console.log("Rafraîchissement forcé des brouillons...");
    await loadBrouillons();
  };

  // Sauvegarder les commandes brouillons
  const saveBrouillonCommandes = async (commandes) => {
    try {
      await AsyncStorage.setItem(DRAFT_ORDERS_KEY, JSON.stringify(commandes));
      setBrouillonCommandes(commandes);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des commandes:", error);
    }
  };

  // Sauvegarder les notes
  const saveNotes = async (newNotesForClient) => {
    try {
      // Récupérer toutes les notes existantes
      const allNotesData = await AsyncStorage.getItem(DRAFT_NOTES_KEY);
      let allNotes = allNotesData ? JSON.parse(allNotesData) : [];

      // Supprimer les anciennes notes de ce client
      allNotes = allNotes.filter((note) => note.clientKunnr !== client.kunnr);

      // Ajouter les nouvelles notes de ce client
      allNotes = [...allNotes, ...newNotesForClient];

      // Sauvegarder toutes les notes
      await AsyncStorage.setItem(DRAFT_NOTES_KEY, JSON.stringify(allNotes));
      setNotes(newNotesForClient);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des notes:", error);
    }
  };

  // Supprimer une commande brouillon
  const deleteCommandeBrouillon = async (id) => {
    Alert.alert("Confirmation", "Voulez-vous supprimer cette commande ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        onPress: async () => {
          const updatedCommandes = brouillonCommandes.filter(
            (cmd) => cmd.id !== id
          );
          await saveBrouillonCommandes(updatedCommandes);
        },
        style: "destructive",
      },
    ]);
    commandeModalizeRef.current?.close();
  };

  // Supprimer une commande brouillon sans alerte
  const deleteCommandeBrouillonDirectly = async (id) => {
    const updatedCommandes = brouillonCommandes.filter((cmd) => cmd.id !== id);
    await saveBrouillonCommandes(updatedCommandes);
  };

  // Modifier une commande brouillon (naviguer vers l'écran de création)
  const modifyCommandeBrouillon = (commande) => {
    commandeModalizeRef.current?.close();
    navigation.navigate("brouillon_cmd", {
      client: commande.client,
      motif: commande.motif,
      draftData: commande,
      isDraft: true,
      isModification: true,
      // ✅ SOLUTION 4: Callback amélioré
      onSave: async () => {
        console.log("Callback onSave appelé depuis modification");
        await forceRefresh();
      },
      // ✅ SOLUTION 5: Callback pour le retour en arrière
      onBack: async () => {
        console.log("Callback onBack appelé");
        await forceRefresh();
      },
    });
  };

  // Créer une nouvelle note
  const createNote = async () => {
    if (newNoteTitle.trim() === "") {
      Alert.alert("Erreur", "Veuillez saisir le titre de la note");
      return;
    }
    if (newNote.trim() === "") {
      Alert.alert("Erreur", "Veuillez saisir le contenu de la note");
      return;
    }

    const note = {
      id: Date.now().toString(),
      title: newNoteTitle.trim(),
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      clientKunnr: client.kunnr, // Correction: utiliser clientKunnr
      clientName: client.name1,
    };

    const updatedNotes = [note, ...notes];
    await saveNotes(updatedNotes);
    setNewNote("");
    setNewNoteTitle("");
    noteModalizeRef.current?.close();
  };
  // Modifier une note
  const updateNote = async (id, title, content) => {
    const updatedNotes = notes.map((note) =>
      note.id === id
        ? {
            ...note,
            title: title.trim(),
            content: content.trim(),
            modifiedAt: new Date().toISOString(),
          }
        : note
    );
    await saveNotes(updatedNotes);
    setEditingNote(null);
    setEditingNoteTitle("");
    setEditingNoteContent("");
  };

  // Supprimer une note
  const deleteNote = async (id) => {
    Alert.alert("Confirmation", "Voulez-vous supprimer cette note ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        onPress: async () => {
          const updatedNotes = notes.filter((note) => note.id !== id);
          await saveNotes(updatedNotes);
          noteModalizeRef.current?.close();
        },
        style: "destructive",
      },
    ]);
  };

  // Ouvrir la modale pour les commandes
  const openCommandeModal = (commande) => {
    setSelectedItem(commande);
    commandeModalizeRef.current?.open();
  };

  // Ouvrir la modale pour créer une note
  const openNoteModal = () => {
    setNewNote("");
    setNewNoteTitle("");
    setEditingNote(null);
    noteModalizeRef.current?.open();
  };
  // 8. Nouvelle fonction pour ouvrir modal d'édition
  const openEditNoteModal = (note) => {
    setEditingNote(note.id);
    setEditingNoteTitle(note.title);
    setEditingNoteContent(note.content);
    noteModalizeRef.current?.open();
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculer le total d'une commande
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      const discountRate = item.discount ? parseFloat(item.discount) / 100 : 0;
      const priceAfterDiscount = item.prix * (1 - discountRate);
      return sum + priceAfterDiscount * item.quantity;
    }, 0);
  };

  // Rendu d'une commande brouillon
  const renderCommandeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openCommandeModal(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.clientInfo}>
          <MaterialIcons name="shopping-cart" size={20} color="#03A9F4" />
          <Text style={styles.clientName}>
            {/* {item.client.name1} */}
            {item.type === "return"
              ? "Retour de marchandise"
              : "Offre de vente"}
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.clientCode}> {item.client.name1}</Text>

      <View style={styles.orderInfo}>
        <Text style={styles.itemCount}>{item.items.length} article(s)</Text>
        <Text style={styles.total}>
          {calculateTotal(item.items).toLocaleString("fr-DZ", {
            style: "currency",
            currency: "DZD",
          })}
        </Text>
      </View>

      {item.motif && (
        <View style={styles.motifContainer}>
          <Text style={styles.motifLabel}>Retour - {item.motif.Txtlg}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Rendu d'une note
  const renderNoteItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        noteStyles.noteGridCard,
        index % 2 === 0 ? noteStyles.leftCard : noteStyles.rightCard,
      ]}
      onPress={() => openEditNoteModal(item)}
    >
      <Text style={noteStyles.noteCardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={noteStyles.noteCardContent} numberOfLines={3}>
        {item.content}
      </Text>
      <Text style={noteStyles.noteCardDate}>{formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  const renderRefreshButton = () => (
    <TouchableOpacity style={styles.refreshButton} onPress={forceRefresh}>
      <MaterialIcons name="refresh" size={24} color="#03A9F4" />
    </TouchableOpacity>
  );

  // ✅ SOLUTION 6: Améliorer la navigation vers nouvelle commande
  const navigateToNewDraft = () => {
    navigation.navigate("brouillon_cmd", {
      client,
      onSave: async () => {
        console.log("Callback onSave appelé depuis nouvelle commande");
        await forceRefresh();
      },
      onBack: async () => {
        console.log("Callback onBack appelé depuis nouvelle commande");
        await forceRefresh();
      },
    });
  };

  const validateCommandeBrouillon = (commande) => {
    commandeModalizeRef.current?.close();

    Alert.alert(
      "Confirmation",
      `Voulez-vous valider cette offre pour ${commande.client.name1} ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Valider",
          onPress: async () => {
            try {
              setLoading(true);

              // Vérifier si c'est une commande de retour
              if (commande.type === "return" && commande.motif?.Augru) {
                const commandeRetourData = {
                  CustomerReturnType: "ZCRN",
                  SoldToParty: commande.client.kunnr,
                  SDDocumentReason: commande.motif.Augru,
                  to_Item: commande.items.map((item) => ({
                    Material: item.id,
                    RequestedQuantity: item.quantity.toString(),
                  })),
                };

                const orderReturnId = await dispatch(
                  addOrderReturn(commandeRetourData)
                );

                if (orderReturnId.error) {
                  Alert.alert(
                    "Erreur",
                    "Échec de la validation de la commande retour"
                  );
                } else {
                  await deleteCommandeBrouillonDirectly(commande.id);

                  Alert.alert(
                    "Succès",
                    `Commande retour validée avec le numéro ${orderReturnId.payload.CustomerReturn}`,
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          navigation.navigate("all_orders", {
                            client,
                            retour: true,
                          });
                        },
                      },
                    ]
                  );
                }
              } else {
                // Cas commande normale
                const commandeData = {
                  SalesQuotationType: "ZOFF",
                  SoldToParty: commande.client.kunnr,
                  to_Item: commande.items.map((item) => {
                    const itemData = {
                      Material: item.id,
                      RequestedQuantity: item.quantity.toString(),
                    };

                    if (item.discount && parseFloat(item.discount) > 0) {
                      itemData.to_PricingElement = [
                        {
                          ConditionType: "ZREM",
                          ConditionRateValue: item.discount.toString(),
                        },
                      ];
                    }

                    return itemData;
                  }),
                };

                const orderId = await dispatch(addQuotation(commandeData));

                if (orderId.error) {
                  Alert.alert(
                    "Erreur",
                    "Échec de la validation de la commande offre"
                  );
                } else {
                  await deleteCommandeBrouillonDirectly(commande.id);

                  Alert.alert(
                    "Succès",
                    `Offre validée avec le numéro ${orderId.payload.SalesQuotation}`,
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          // navigation.navigate("commande_liste", { client });
                          navigation.navigate("quotation_liste", { client });
                        },
                      },
                    ]
                  );
                }
              }
            } catch (error) {
              console.error("Erreur lors de la validation:", error);
              Alert.alert(
                "Erreur",
                "Une erreur est survenue lors de la validation"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const noteStyles = {
    notesGridContainer: {
      padding: 16,
      paddingBottom: 100, // Espace pour le FAB
    },
    notesRow: {
      justifyContent: "space-between",
      marginBottom: 16,
    },
    noteGridCard: {
      backgroundColor: "white",
      borderRadius: 10,
      padding: 16,
      elevation: 0.8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      minHeight: 140,
      maxHeight: 180,
    },
    leftCard: {
      flex: 1,
      // marginRight: 8,
    },
    rightCard: {
      flex: 1,
      marginLeft: 8,
    },
    noteCardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#1F2937",
      marginBottom: 8,
      lineHeight: 20,
    },
    noteCardContent: {
      fontSize: 14,
      color: "#6B7280",
      flex: 1,
      lineHeight: 18,
    },
    noteCardDate: {
      fontSize: 12,
      color: "#9CA3AF",
      marginTop: 8,
      fontStyle: "italic",
    },
    // Styles pour la modale
    noteModalContent: {
      minHeight: 400,
    },
    noteInput: {
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: "#F9FAFB",
      marginBottom: 16,
    },
    noteContentInput: {
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: "#F9FAFB",
      height: 150,
      textAlignVertical: "top",
      marginBottom: 16,
    },
    modalActionButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 16,
    },
    modalButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    saveButton: {
      backgroundColor: "#10B981",
    },
    deleteButton: {
      backgroundColor: "#EF4444",
    },
    cancelButton: {
      backgroundColor: "#6B7280",
    },
    modalButtonText: {
      color: "white",
      fontWeight: "600",
      marginLeft: 8,
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      <View style={styles.headerContainer}>
        <View style={styles.clientSection}>
          <View style={styles.clientIconContainer}>
            <MaterialIcons name="person" size={24} color="white" />
          </View>
          <View style={styles.clientheaderDetails}>
            <Text style={styles.clientheaderLabel}>Client</Text>
            <Text style={styles.clientheaderName}>{client.name1}</Text>
            <Text style={styles.clientheaderCode}>{client.kunnr}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "commandes" && styles.activeTab]}
          onPress={() => setActiveTab("commandes")}
        >
          <MaterialIcons
            name="shopping-cart"
            size={20}
            color={activeTab === "commandes" ? "#03A9F4" : "#757575"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "commandes" && styles.activeTabText,
            ]}
          >
            Commandes ({brouillonCommandes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "notes" && styles.activeTab]}
          onPress={() => setActiveTab("notes")}
        >
          <MaterialCommunityIcons
            name="note-text"
            size={20}
            color={activeTab === "notes" ? "#03A9F4" : "#757575"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "notes" && styles.activeTabText,
            ]}
          >
            Notes ({notes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content - reste identique */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#03A9F4" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : (
          <>
            {activeTab === "commandes" ? (
              brouillonCommandes.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons
                    name="shopping-cart"
                    size={64}
                    color="#E0E0E0"
                  />
                  <Text style={styles.emptyTitle}>
                    Aucune commande brouillon
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Les commandes non terminées apparaîtront ici
                  </Text>
                  {/* ✅ Bouton refresh dans l'état vide */}
                  <TouchableOpacity
                    style={styles.refreshEmptyButton}
                    onPress={forceRefresh}
                  >
                    <MaterialIcons name="refresh" size={20} color="#03A9F4" />
                    <Text style={styles.refreshEmptyText}>Actualiser</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={brouillonCommandes}
                  renderItem={renderCommandeItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                  // ✅ Pull to refresh
                  refreshControl={
                    <RefreshControl
                      refreshing={loading}
                      onRefresh={forceRefresh}
                      colors={["#03A9F4"]}
                    />
                  }
                />
              )
            ) : notes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="note-text"
                  size={64}
                  color="#E0E0E0"
                />
                <Text style={styles.emptyTitle}>Aucune note</Text>
                <Text style={styles.emptySubtitle}>
                  Appuyez sur + pour créer une note
                </Text>
              </View>
            ) : (
              activeTab === "notes" && (
                <FlatList
                  key="notes-grid" // ✅ Clé fixe pour éviter le re-render
                  data={notes}
                  renderItem={renderNoteItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  contentContainerStyle={noteStyles.notesGridContainer}
                  columnWrapperStyle={
                    notes.length > 0 ? noteStyles.notesRow : null
                  }
                  showsVerticalScrollIndicator={false}
                />
              )
            )}
          </>
        )}
      </View>

      {/* Bouton FAB pour les commandes */}
      {activeTab === "commandes" && (
        // <TouchableOpacity
        //   style={[styles.fab, styles.fabCommandes]}
        //   onPress={navigateToNewDraft}
        // >
        //   <MaterialIcons name="shopping-cart" size={24} color="white" />
        // </TouchableOpacity>
        <CommandFloatingButton
          navigation={navigation}
          client={client}
          onReturnPress={handleReturnPress}
        />
      )}

      {/* Bouton FAB pour les notes */}

      {activeTab === "notes" && (
        <TouchableOpacity
          style={[styles.fab, styles.fabNotes]}
          onPress={openNoteModal}
        >
          <MaterialCommunityIcons name="note-plus" size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Modales - reste identique */}
      <Modalize
        ref={commandeModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modal}
        scrollViewProps={{ scrollEnabled: false }} // Désactive le scroll global
        disableScrollIfPossible={false}
        closeOnOverlayTap={true}
        threshold={100}
        panGestureComponentEnabled={false}
        closeSnapPointStraightEnabled={false}
        velocityThreshold={0.8}
        panGestureEnabled={false}
        keyboardAvoidingBehavior="padding"
        avoidKeyboardLikeIOS={true}
      >
        {selectedItem && (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de la commande</Text>
              <TouchableOpacity
                onPress={() => commandeModalizeRef.current?.close()}
              >
                <MaterialIcons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            {/* Informations client - partie fixe */}
            <View style={styles.commandeDetails}>
              <Text style={styles.commandeClient}>
                {selectedItem.client.name1}
              </Text>
              {/* <Text style={styles.commandeCode}>
                Code: {selectedItem.client.kunnr}
              </Text> */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.commandeItems}>
                  {selectedItem.items.length} article(s)
                </Text>
                <Text style={styles.commandeTotal}>
                  Total:{" "}
                  {calculateTotal(selectedItem.items).toLocaleString("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                  })}
                </Text>
              </View>
            </View>

            {/* Tableau des articles - partie scrollable */}
            <View
              style={[
                styles.commandeDetails,
                {
                  borderTopWidth: 0.5,
                  borderColor: "rgba(104, 104, 107, 0.32)",
                  backgroundColor: "rgba(233, 220, 188, 0.1)",
                  marginTop: 10,
                  flex: 1, // Prend tout l'espace disponible
                },
              ]}
            >
              <Text style={styles.detailsTitle}>Articles</Text>

              {/* En-têtes du tableau (fixe) */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.codeColumn]}>
                  Code
                </Text>
                <Text
                  style={[styles.tableHeaderText, styles.designationColumn]}
                >
                  Désignation
                </Text>
                <Text style={[styles.tableHeaderText, styles.qteColumn]}>
                  Qté
                </Text>
                <Text style={[styles.tableHeaderText, styles.prixColumn]}>
                  Prix
                </Text>
              </View>

              {/* Liste scrollable des articles */}
              <ScrollView
                style={styles.scrollableArticleContainer}
                contentContainerStyle={styles.articleContainer}
              >
                {selectedItem.items.map((article, index) => (
                  <View
                    key={`${article.id}-${index}`}
                    style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}
                  >
                    {/* Code */}
                    <View style={styles.codeColumn}>
                      <Text style={styles.designationCellText}>
                        {article.id}
                      </Text>
                    </View>

                    {/* Désignation */}
                    <View style={styles.designationColumn}>
                      <Text
                        style={styles.designationCellText}
                        numberOfLines={2}
                      >
                        {article.designation}
                      </Text>
                    </View>

                    {/* Quantité */}
                    <View style={styles.qteColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {article.quantity} {article.unite}
                      </Text>
                    </View>

                    {/* Prix */}
                    <View style={styles.prixColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {article.prix.toFixed(2)} DA
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Boutons d'action - partie fixe */}
            {/* <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.modifyButton]}
                onPress={() => modifyCommandeBrouillon(selectedItem)}
              >
                <MaterialIcons name="edit" size={20} color="white" />
                <Text style={styles.actionButtonText}>Modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.validateButton]}
                onPress={() => validateCommandeBrouillon(selectedItem)}
              >
                <MaterialIcons name="check-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>Valider</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteCommandeBrouillon(selectedItem.id)}
              >
                <MaterialIcons name="delete" size={20} color="white" />
                <Text style={styles.actionButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View> */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.outlineButton]}
                onPress={() => modifyCommandeBrouillon(selectedItem)}
              >
                <MaterialIcons name="edit" size={18} color="#374151" />
                <Text style={styles.outlineButtonText}>Modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.outlineDangerButton]}
                onPress={() => deleteCommandeBrouillon(selectedItem.id)}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={18}
                  color="#B91C1C"
                />
                <Text style={styles.outlineDangerText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => validateCommandeBrouillon(selectedItem)}
              >
                <MaterialIcons name="check" size={18} color="white" />
                <Text style={styles.primaryButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modalize>

      {/* Modale pour créer une note - reste identique */}
      <Modalize
        ref={noteModalizeRef}
        // modalHeight={500}
        modalStyle={styles.modal}
        scrollViewProps={{ scrollEnabled: false }}
        keyboardAvoidingBehavior="padding"
        adjustToContentHeight
        disableScrollIfPossible={false}
        closeOnOverlayTap={true}
        threshold={100}
        panGestureComponentEnabled={false}
        closeSnapPointStraightEnabled={false}
        velocityThreshold={0.8}
        panGestureEnabled={false}
        avoidKeyboardLikeIOS={true}
      >
        <View style={[styles.modalContent, noteStyles.noteModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingNote ? "Modifier la note" : "Nouvelle note"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                noteModalizeRef.current?.close();
                setEditingNote(null);
                setEditingNoteTitle("");
                setEditingNoteContent("");
              }}
            >
              <MaterialIcons name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={noteStyles.noteInput}
            placeholder="Titre de la note..."
            value={editingNote ? editingNoteTitle : newNoteTitle}
            onChangeText={editingNote ? setEditingNoteTitle : setNewNoteTitle}
            autoFocus={!editingNote}
            maxLength={50}
          />

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <TextInput
              style={noteStyles.noteContentInput}
              placeholder="Contenu de la note..."
              multiline
              value={editingNote ? editingNoteContent : newNote}
              onChangeText={editingNote ? setEditingNoteContent : setNewNote}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={noteStyles.modalActionButtons}>
            {editingNote ? (
              <>
                <TouchableOpacity
                  style={[noteStyles.modalButton, noteStyles.deleteButton]}
                  onPress={() => deleteNote(editingNote)}
                >
                  <MaterialIcons name="delete" size={20} color="white" />
                  <Text style={noteStyles.modalButtonText}>Supprimer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[noteStyles.modalButton, noteStyles.saveButton]}
                  onPress={() =>
                    updateNote(
                      editingNote,
                      editingNoteTitle,
                      editingNoteContent
                    )
                  }
                >
                  <MaterialIcons name="save" size={20} color="white" />
                  <Text style={noteStyles.modalButtonText}>Sauvegarder</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[noteStyles.modalButton, noteStyles.saveButton]}
                onPress={createNote}
              >
                <MaterialIcons name="save" size={20} color="white" />
                <Text style={noteStyles.modalButtonText}>Créer la note</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modalize>

      {/* Modalize pour les motifs */}
      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        modalStyle={styles.modal}
        handlePosition="inside"
        scrollViewProps={{ scrollEnabled: false }}
        disableScrollIfPossible={false}
        closeOnOverlayTap={true}
        threshold={100}
        panGestureComponentEnabled={false}
        closeSnapPointStraightEnabled={false}
        velocityThreshold={0.8}
        panGestureEnabled={false}
        keyboardAvoidingBehavior="padding"
        avoidKeyboardLikeIOS={true}
      >
        <View style={styles.modalContent}>
          {/* Entête fixe */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Sélectionnez un motif de retour
            </Text>
            <TouchableOpacity onPress={() => modalizeRef.current?.close()}>
              <MaterialIcons name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          {/* Partie scrollable */}
          <ScrollView
            style={styles.scrollableMotifContainer}
            contentContainerStyle={styles.motifListContent}
          >
            {motifs.map((item) => (
              <TouchableOpacity
                key={item.Augru}
                style={styles.motifItem}
                onPress={() => handleMotifSelect(item)}
              >
                <Text style={styles.motifText}>{item.Bezei}</Text>
                <Text style={styles.motifCode}>Code: {item.Augru}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modalize>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#03A9F4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.3),
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "white",
  },
  headerContainer: {
    backgroundColor: "#03A9F4",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.3),
  },
  clientSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: scale(25),
    width: scale(50),
    height: scale(50),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3),
  },
  clientheaderDetails: {
    flex: 1,
  },
  clientheaderLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: fs(12),
    fontWeight: fontWeight.medium,
  },
  clientheaderName: {
    color: "white",
    fontSize: fs(18),
    fontWeight: fontWeight.medium,
  },
  clientheaderCode: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: fs(14),
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.3),
    paddingHorizontal: wp(4),
  },
  activeTab: {
    borderBottomWidth: scale(3),
    borderBottomColor: "#03A9F4",
  },
  tabText: {
    marginLeft: scale(8),
    fontSize: fs(14),
    color: "#757575",
  },
  activeTabText: {
    color: "#03A9F4",
    fontWeight: fontWeight.semiBold,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: hp(1.7),
    fontSize: fs(16),
    color: "#757575",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(32),
  },
  emptyTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#757575",
    marginTop: hp(1.7),
  },
  emptySubtitle: {
    fontSize: fs(14),
    color: "#9E9E9E",
    marginTop: hp(0.9),
    textAlign: "center",
  },
  listContainer: {
    paddingTop: hp(1.6),
  },
  card: {
    backgroundColor: "white",
    borderRadius: scale(8),
    padding: scale(16),
    marginBottom: hp(0.3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: scale(2),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(0.9),
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  clientName: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginLeft: scale(8),
    flex: 1,
  },
  date: {
    fontSize: fs(12),
    color: "#757575",
  },
  clientCode: {
    fontSize: fs(14),
    color: "#757575",
    marginBottom: hp(0.9),
  },
  orderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCount: {
    fontSize: fs(14),
    color: "#757575",
  },
  total: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#03A9F4",
  },
  motifContainer: {
    marginTop: hp(0.9),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    backgroundColor: "#E3F2FD",
    borderRadius: scale(4),
    alignSelf: "flex-start",
  },
  motifLabel: {
    fontSize: fs(12),
    color: "#1976D2",
  },
  noteCard: {
    backgroundColor: "white",
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: hp(1.3),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: scale(2),
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1.3),
  },
  noteDate: {
    fontSize: fs(12),
    color: "#757575",
    marginLeft: scale(8),
    flex: 1,
  },
  noteContent: {
    fontSize: fs(14),
    lineHeight: scale(20),
    color: "#333",
  },
  modifiedDate: {
    fontSize: fs(11),
    color: "#9E9E9E",
    marginTop: hp(0.9),
    fontStyle: "italic",
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  editInput: {
    flex: 1,
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    borderRadius: scale(8),
    padding: scale(8),
    fontSize: fs(14),
    minHeight: hp(6.6),
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: scale(20),
    width: scale(36),
    height: scale(36),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: scale(8),
  },
  fab: {
    position: "absolute",
    right: wp(4),
    bottom: hp(1.7),
    backgroundColor: "#FFA000",
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
  },
  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    maxHeight: "90%",
  },
  modalContent: {
    padding: scale(8),
    paddingBottom: hp(2.6),
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(1.1),
    paddingHorizontal: wp(3),
  },
  modalTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#333",
  },
  commandeDetails: {
    padding: scale(16),
    backgroundColor: "#FAFAFA",
    borderRadius: scale(8),
    marginBottom: hp(1.3),
  },
  commandeClient: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginBottom: hp(0.4),
  },
  commandeCode: {
    fontSize: fs(14),
    color: "#757575",
    marginBottom: hp(0.4),
  },
  commandeItems: {
    fontSize: fs(14),
    color: "#757575",
    marginBottom: hp(0.4),
  },
  commandeTotal: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#03A9F4",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: scale(10),
    marginTop: hp(1.7),
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.1),
    marginHorizontal: scale(4),
    borderRadius: scale(10),
    borderWidth: scale(1),
  },
  primaryButton: {
    backgroundColor: "#006475",
    borderColor: "#2563EB",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: fontWeight.semiBold,
    fontSize: fs(14),
    marginLeft: scale(6),
  },
  outlineButton: {
    backgroundColor: "white",
    borderColor: "#D1D5DB",
  },
  outlineButtonText: {
    color: "#374151",
    fontWeight: fontWeight.medium,
    fontSize: fs(14),
    marginLeft: scale(6),
  },
  outlineDangerButton: {
    backgroundColor: "white",
    borderColor: "#FCA5A5",
  },
  outlineDangerText: {
    color: "#B91C1C",
    fontWeight: fontWeight.medium,
    fontSize: fs(14),
    marginLeft: scale(6),
  },
  noteInput: {
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    borderRadius: scale(8),
    padding: scale(12),
    fontSize: fs(14),
    minHeight: hp(13.1),
    textAlignVertical: "top",
    marginBottom: hp(1.7),
  },
  createNoteButton: {
    backgroundColor: "#03A9F4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.3),
    borderRadius: scale(8),
  },
  createNoteButtonText: {
    color: "white",
    fontWeight: fontWeight.bold,
    marginLeft: scale(8),
    fontSize: fs(16),
  },
  refreshButton: {
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: "rgba(3, 169, 244, 0.1)",
  },
  refreshEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    marginTop: hp(2.2),
    borderRadius: scale(20),
    backgroundColor: "rgba(3, 169, 244, 0.1)",
  },
  refreshEmptyText: {
    color: "#03A9F4",
    marginLeft: scale(5),
    fontSize: fs(14),
  },
  scrollableArticleContainer: {
    flex: 1,
    maxHeight: hp(32.8),
  },
  articleContainer: {
    borderWidth: scale(1),
    borderTopWidth: 0,
    borderBottomRightRadius: scale(8),
    borderBottomLeftRadius: scale(8),
    borderColor: "#eee",
  },
  detailsTitle: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginBottom: hp(1.3),
    color: "#424242",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: hp(1.1),
    paddingHorizontal: scale(8),
    borderTopRightRadius: scale(8),
    borderTopLeftRadius: scale(8),
    borderBottomWidth: scale(1),
    borderBottomColor: "#ddd",
  },
  tableHeaderText: {
    fontSize: fs(12),
    fontWeight: fontWeight.bold,
    color: "#333",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: hp(1.1),
    paddingHorizontal: scale(8),
    borderBottomWidth: scale(1),
    borderBottomColor: "#eee",
  },
  evenRow: {
    backgroundColor: "#f8f9fa",
  },
  codeColumn: {
    flex: 2,
    justifyContent: "center",
  },
  designationColumn: {
    flex: 4,
    justifyContent: "center",
    paddingHorizontal: scale(4),
  },
  qteColumn: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    textAlign: "right",
  },
  prixColumn: {
    flex: 2,
    alignItems: "flex-end",
    justifyContent: "center",
    textAlign: "right",
  },
  designationCellText: {
    fontSize: fs(10),
    color: "#212529",
  },
  tableCellTextRight: {
    fontSize: fs(11),
    color: "#212529",
    textAlign: "right",
  },
  scrollableMotifContainer: {
    maxHeight: hp(32.8),
  },
  motifListContent: {
    padding: scale(16),
    paddingTop: hp(2.2),
    paddingBottom: hp(2.2),
  },
  motifItem: {
    padding: scale(12),
    marginBottom: hp(0.9),
    backgroundColor: "#f5f5f5",
    borderRadius: scale(8),
  },
  motifText: {
    fontSize: fs(16),
    color: "#333",
  },
  motifCode: {
    fontSize: fs(12),
    color: "#777",
    marginTop: hp(0.5),
  },
});
export default BrouillonScreen;
