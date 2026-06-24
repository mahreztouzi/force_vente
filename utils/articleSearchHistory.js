import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "article_search_history";
const MAX_HISTORY = 10;

export const getArticleSearchHistory = async () => {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.log("Erreur lecture historique article", e);
    return [];
  }
};

export const addArticleSearchTerm = async (term) => {
  const trimmed = term.trim();
  if (!trimmed) return;

  try {
    const history = await getArticleSearchHistory();
    const filtered = history.filter(
      (t) => t.toLowerCase() !== trimmed.toLowerCase(),
    );
    const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.log("Erreur sauvegarde historique article", e);
  }
};

export const removeArticleSearchTerm = async (term) => {
  try {
    const history = await getArticleSearchHistory();
    const updated = history.filter((t) => t !== term);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.log("Erreur suppression historique article", e);
  }
};

export const clearArticleSearchHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.log("Erreur clear historique article", e);
  }
};
