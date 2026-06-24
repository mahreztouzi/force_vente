import AsyncStorage from "@react-native-async-storage/async-storage";

const CART_KEY = "cart_items";

const listeners = new Set();

const notify = (items) => {
  listeners.forEach((cb) => cb(items));
};

export const subscribeToCart = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const getCartItems = async () => {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.log("Erreur lecture panier", e);
    return [];
  }
};

export const saveCartItems = async (items) => {
  try {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
    notify(items);
  } catch (e) {
    console.log("Erreur sauvegarde panier", e);
  }
};

export const upsertCartItem = async (article, quantity) => {
  const items = await getCartItems();
  const index = items.findIndex((it) => it.id === article.id);

  if (quantity <= 0) {
    const filtered = items.filter((it) => it.id !== article.id);
    await saveCartItems(filtered);
    return filtered;
  }

  if (index !== -1) {
    items[index] = { ...items[index], quantity };
  } else {
    items.push({
      id: article.id,
      designation: article.designation,
      prix: article.prix,
      unite: article.unite,
      Category: article.Category,
      image: article.image,
      quantity,
    });
  }

  await saveCartItems(items);
  return items;
};

export const removeCartItem = async (articleId) => {
  const items = await getCartItems();
  const filtered = items.filter((it) => it.id !== articleId);
  await saveCartItems(filtered);
  return filtered;
};

export const clearCart = async () => {
  await saveCartItems([]);
};

// CORRIGÉ : compte le nombre d'articles DISTINCTS dans le panier, pas la somme des quantités
export const getCartCount = (items) => items.length;

export const getCartTotal = (items) =>
  items.reduce((sum, it) => sum + parseFloat(it.prix || 0) * it.quantity, 0);
