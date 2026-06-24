/**
 * Applique une liste ordonnée de critères de tri à un tableau d'articles.
 * activeSorts: [{ key: "prix"|"quantite"|"alphabet", direction: "asc"|"desc" }, ...]
 * L'ordre du tableau = priorité (le premier élément départage en premier).
 */
export const applySorts = (articles, activeSorts) => {
  if (!activeSorts?.length) return articles;

  const sorted = [...articles];

  sorted.sort((a, b) => {
    for (const { key, direction } of activeSorts) {
      let diff = 0;

      if (key === "prix") {
        diff = parseFloat(a.prix || 0) - parseFloat(b.prix || 0);
      } else if (key === "quantite") {
        // Pas de champ stock réel encore — utilise un fallback à 0 pour ne pas planter le tri
        diff =
          parseFloat(a.stock || a.quantite || 0) -
          parseFloat(b.stock || b.quantite || 0);
      } else if (key === "alphabet") {
        diff = (a.designation || "").localeCompare(b.designation || "");
      }

      if (diff !== 0) {
        return direction === "asc" ? diff : -diff;
      }
    }
    return 0;
  });

  return sorted;
};

// Filtre stock — laissé en no-op tant que les données stock n'existent pas côté backend.
// Le paramètre est accepté pour ne pas casser l'appel, mais ne filtre rien pour l'instant.
export const applyStockFilter = (articles, stockFilter) => {
  if (stockFilter === "all") return articles;
  // TODO: brancher sur le vrai champ stock dès qu'il sera disponible (ex: item.stock > 0)
  return articles;
};
