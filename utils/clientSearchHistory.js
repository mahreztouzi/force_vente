import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "client_search_history";
const MAX_HISTORY = 10;

export const getSearchHistory = async () => {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.log("Erreur lecture historique client", e);
    return [];
  }
};

// Ajoute un terme de recherche en tête de liste, sans doublon, limité à MAX_HISTORY
export const addSearchTerm = async (term) => {
  const trimmed = term.trim();
  if (!trimmed) return;

  try {
    const history = await getSearchHistory();
    const filtered = history.filter(
      (t) => t.toLowerCase() !== trimmed.toLowerCase(),
    );
    const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.log("Erreur sauvegarde historique client", e);
  }
};

export const removeSearchTerm = async (term) => {
  try {
    const history = await getSearchHistory();
    const updated = history.filter((t) => t !== term);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.log("Erreur suppression historique client", e);
  }
};

export const clearSearchHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.log("Erreur clear historique client", e);
  }
};
