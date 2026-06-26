// utils/pdfA4Generator.js

export const generateA4InvoicePDF = (deliveryData) => {
  const currentDate = new Date().toLocaleDateString("fr-FR");
  const currentTime = new Date().toLocaleTimeString("fr-FR");

  // Calculer le total
  const totalPrice = deliveryData.articles.reduce(
    (sum, item) =>
      sum + parseFloat(item.quantite) * parseFloat(item.prixUnitaire || 0),
    0,
  );
  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const numberToWordsFR = (number) => {
    const units = [
      "zéro",
      "un",
      "deux",
      "trois",
      "quatre",
      "cinq",
      "six",
      "sept",
      "huit",
      "neuf",
      "dix",
      "onze",
      "douze",
      "treize",
      "quatorze",
      "quinze",
      "seize",
      "dix-sept",
      "dix-huit",
      "dix-neuf",
    ];

    const tens = [
      "",
      "",
      "vingt",
      "trente",
      "quarante",
      "cinquante",
      "soixante",
      "soixante",
      "quatre-vingt",
      "quatre-vingt",
    ];

    const convertUnder100 = (n) => {
      if (n < 20) return units[n];

      const t = Math.floor(n / 10);
      const u = n % 10;

      // Cas spéciaux pour 70-79 et 90-99
      if (t === 7) return "soixante-" + units[10 + u];
      if (t === 9) return "quatre-vingt-" + units[10 + u];

      // Cas spécial pour 80
      if (t === 8 && u === 0) return "quatre-vingts";

      // Autres cas
      return (
        tens[t] +
        (u ? (u === 1 && t < 8 && t > 1 ? "-et-un" : "-" + units[u]) : "")
      );
    };

    const convertUnder1000 = (n) => {
      if (n < 100) return convertUnder100(n);

      const h = Math.floor(n / 100);
      const r = n % 100;

      let result = "";

      if (h === 1) {
        result = "cent";
      } else {
        result = units[h] + " cent";
      }

      // Pluriel de cent
      if (h > 1 && r === 0) result += "s";

      if (r) result += " " + convertUnder100(r);

      return result;
    };

    if (number === 0) return "zéro";

    let result = "";
    let n = Math.floor(number);

    // Millions
    if (n >= 1000000) {
      const millions = Math.floor(n / 1000000);
      result +=
        millions === 1
          ? "un million "
          : convertUnder1000(millions) + " millions ";
      n %= 1000000;
    }

    // Milliers
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      result +=
        thousands === 1 ? "mille " : convertUnder1000(thousands) + " mille ";
      n %= 1000;
    }

    // Centaines, dizaines, unités
    if (n > 0) result += convertUnder1000(n);

    return result.trim();
  };

  // Utilisation avec les décimales
  const formatTotalInWords = (amount) => {
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let result = numberToWordsFR(integerPart) + " dinars";

    if (decimalPart > 0) {
      result += " et " + numberToWordsFR(decimalPart) + " centimes";
    }

    return result;
  };

  const totalInWords = formatTotalInWords(deliveryData.totalMontant);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bon de Facture A4</title>
      <style>
        @page {
          size: A4 portrait;
          // margin: 5mm 10mm;
          margin: 10mm 0mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          width: 100%;
          height: 100%;
        }
        
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #000;
          background: white;
        }
        
        .container {
          width: 100%;
          max-width: 100%;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        
        .document-title {
          font-size: 26pt;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .delivery-number {
          font-size: 16pt;
          font-weight: bold;
          color: #333;
        }
        
        .info-section {
          width: 100%;
          margin-bottom: 20px;
          display: table;
        }
        
        .info-row {
          display: table-row;
          width: 100%;
        }
        
        .info-cell {
          display: table-cell;
          padding: 4px 0;
          vertical-align: top;
        }
        
        .info-cell.label {
          font-weight: bold;
          width: 20%;
          color: #333;
        }
        
        .info-cell.value {
          width: 30%;
          color: #000;
        }
        
        .separator {
          border-top: 1px solid #ccc;
          margin: 15px 0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 10pt;
        }
        
        thead {
          background-color: #f5f5f5;
        }
        
        thead tr {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
        }
        
        th {
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          font-size: 10pt;
          white-space: nowrap;
        }
        
        th.center {
          text-align: center;
        }
        
        th.right {
          text-align: right;
        }
        
        tbody tr {
          border-bottom: 1px solid #ddd;
          page-break-inside: avoid;
        }
        
        tbody tr:nth-child(even) {
          background-color: #fafafa;
        }
        
        td {
          padding: 10px 8px;
          vertical-align: middle;
        }
        
        td.center {
          text-align: center;
        }
        
        td.right {
          text-align: right;
        }
        
        td.num {
          width: 5%;
          text-align: center;
          font-weight: bold;
        }
        
        td.code {
          width: 12%;
          font-family: 'Courier New', monospace;
          font-size: 9pt;
        }
        
        td.desc {
          width: 30%;
        }
        
        td.lot {
          width: 10%;
          text-align: center;
          font-style: italic;
          color: #666;
        }
        
        td.qte {
          width: 8%;
          text-align: center;
          font-weight: bold;
        }
        
        td.unite {
          width: 8%;
          text-align: center;
        }
        
        td.prix {
          width: 13%;
          text-align: right;
          font-family: 'Courier New', monospace;
        }
        
        td.montant {
          width: 14%;
          text-align: right;
          font-weight: bold;
          font-family: 'Courier New', monospace;
        }
        
        .totals-section {
          margin-top: 30px;
          width: 100%;
          display: flex;
          justify-content: flex-end;
        }
        
        .totals-box {
          width: 40%;
          border: 3px solid #000;
          padding: 15px 20px;
          background: #f9f9f9;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 14pt;
          font-weight: bold;
        }
        
        .total-label {
          font-weight: bold;
        }
        
        .total-value {
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 10pt;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
        
        .footer-thank {
          font-size: 13pt;
          color: #000;
          margin-bottom: 8px;
          font-weight: bold;
        }
        
        .amount-words {
  display: flex;
  flex-direction: column;
}

.amount-title {
  font-weight: bold;
  margin-bottom: 6px;
}

.amount-value {
  font-weight: normal;
 text-transform: capitalize;
}

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          thead {
            display: table-header-group;
          }
          
          tr {
            page-break-inside: avoid;
          }

        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- En-tête -->
        <div class="header">
          <div class="document-title">Bon de Livraison</div>
          <div class="delivery-number">N° ${deliveryData.numero || "XXXXXXXX"}</div>
        </div>

        <!-- Informations générales -->
        <div class="info-section">
          <div class="info-row">
            <div class="info-cell label">Date :</div>
            <div class="info-cell value">${deliveryData.date || currentDate}</div>
            <div class="info-cell label">Client :</div>
            <div class="info-cell value">${deliveryData.clientId || "N/A"}</div>
          </div>
          
          <div class="info-row">
         <div class="info-cell label">Livreur :</div>
            <div class="info-cell value">${deliveryData.livreur || "N/A"}</div>
            <div class="info-cell label">Nom :</div>
            <div class="info-cell value">${deliveryData.clientNom || "N/A"}</div>
          </div>
        </div>

        <div class="separator"></div>

        <!-- Tableau des articles -->
        <table>
          <thead>
            <tr>
              <th class="center">N°</th>
              <th>CODE</th>
              <th>DESIGNATION</th>
              <th class="center">LOT</th>
              <th class="center">QTE</th>
              <th class="center">UNITE</th>
              <th class="right">PRIX UNITAIRE</th>
              <th class="right">MONTANT</th>
            </tr>
          </thead>
          <tbody>
            ${deliveryData.articles
              .map((item, index) => {
                const quantite = parseFloat(item.quantite || 0);
                const prixUnitaire = parseFloat(item.prixUnitaire || 0);
                const montant = quantite * prixUnitaire;

                return `
                <tr>
                  <td class="num">${index + 1}</td>
                  <td class="code">${item.code || ""}</td>
                  <td class="desc">${item.description || ""}</td>
                  <td class="lot">${item.lot || "-"}</td>
                  <td class="qte">${formatNumber(quantite, 2)}</td>
                  <td class="unite">${item.unite || ""}</td>
                  <td class="prix">${formatNumber(prixUnitaire, 2)} DA</td>
                  <td class="montant">${formatNumber(montant, 2)} DA</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>

        <!-- Section des totaux -->
        <div class="totals-section">
            <!--<div class="amount-words">
  <div class="amount-title">Montant en lettres :</div>
  <div class="amount-value">${totalInWords}</div>
</div>-->
          <div class="totals-box">

            <div class="total-row">
              <span class="total-label">TOTAL :</span>
              <span class="total-value">${formatNumber(deliveryData.totalMontant, 2)} DA</span>
            </div>
          </div>
        </div>

   
      </div>
    </body>
    </html>
  `;
};

// utils/pdf/pdfThermalGenerator.js
export const generateThermalPDFContent = (
  deliveryData,
  livraisonItems = [],
  userData = {},
  order = {},
  client = {},
) => {
  const currentDate = new Date().toLocaleDateString("fr-FR");
  const currentTime = new Date().toLocaleTimeString("fr-FR");

  // Calculer les totaux à partir des articles à livrer
  const articlesALivrer = livraisonItems.filter((item) => item.qteALivrer > 0);

  const totalItems = articlesALivrer.length;
  const totalQuantity = articlesALivrer.reduce(
    (sum, item) => sum + item.qteALivrer,
    0,
  );
  const totalPrice = articlesALivrer.reduce(
    (sum, item) => sum + item.qteALivrer * (item.kbetr || 0),
    0,
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bon de Livraison</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 2mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 20px;
          line-height: 1.2;
          width: 76mm;
          color: #000;
          background: white;
        }
        
        .receipt-container {
          width: 100%;
          padding: 2mm;
        }
        
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 3mm;
          margin-bottom: 3mm;
        }
        
        .company-name {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 1mm;
        }
        
        .document-title {
          font-size: 20px;
          font-weight: bold;
          margin: 2mm 0;
          text-transform: uppercase;
        }
        
        .delivery-number {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 1mm;
        }
        
        .info-section {
          margin: 3mm 0;
          font-size: 16px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
          align-items: flex-start;
        }
        
        .info-label {
          font-weight: bold;
          min-width: 25mm;
          font-size: 16px;
        }
        
        .info-value {
          text-align: right;
          flex: 1;
          word-wrap: break-word;
          font-size: 16px;
        }
        
        .separator {
          border-top: 1px dashed #000;
          margin: 3mm 0;
        }
        
        .items-header {
          font-weight: bold;
          border-bottom: 1px solid #000;
          padding: 1mm 0;
          margin-bottom: 2mm;
          font-size: 14px;
        }
        
        .item-row {
          margin-bottom: 2mm;
          padding-bottom: 2mm;
          font-size: 12px;
          font-weight: bold;
        }
        
        .item-code {
          font-weight: bold;
          margin-bottom: 0.5mm;
          font-size: 12px;
        }
        
        .item-desc {
          margin-bottom: 1mm;
          word-wrap: break-word;
          font-size: 12px;
        }
        
        .details-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-top: 1mm;
        }
        
        .separator-article {
          border-top: 1px dashed #000;
          margin-bottom: 1mm;
        }
        
        .separator-details {
          border-top: 1px solid #000;
          margin-bottom: 1mm;
          width: 65%;
        }
        
        .item-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          font-weight: bold;
          color: black;
          margin-bottom: 0.5mm;
          width: 65%;
        }
        
        .item-lot {
          color: black;
          font-style: italic;
          margin-bottom: 0.5mm;
        }
        
        .quantity-box {
          text-align: left;
          font-weight: bold;
          font-size: 10px;
        }
        
        .quantity-box-val {
          text-align: right;
          font-weight: bold;
          font-size: 10px;
        }
        
        .totals {
          border-top: 1px solid #000;
          padding-top: 2mm;
          margin-top: 3mm;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
          font-weight: bold;
          font-size: 16px;
          color: black;
        }
        
        .footer {
          text-align: center;
          margin-top: 5mm;
          padding-top: 3mm;
          border-top: 1px dashed #000;
          font-size: 22px;
        }
        
        @media print {
          body { 
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="document-title">Bon de Facture</div>
          <div class="delivery-number">N° ${deliveryData?.numero || "XXXXXXXX"}</div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${currentDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Heure:</span>
            <span class="info-value">${currentTime}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Client:</span>
            <span class="info-value">${order?.client || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Nom:</span>
            <span class="info-value">${client?.name1 || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Livreur:</span>
            <span class="info-value">${userData?.magasin || "N/A"}</span>
          </div>
        </div>

        <div class="separator"></div>

        <div class="items-header">ARTICLES LIVRES</div>
        
        ${articlesALivrer
          .map(
            (item, index) => `
            <div class="item-row">
              ${index !== 0 ? '<div class="separator-article"></div>' : ""}
              <div class="item-code">${item.id}</div>
              <div class="item-desc">${item.designation}</div>
              <div class="details-container">
                <div class="separator-details"></div>
                <div class="item-details">
                  <span class="quantity-box">Qté livrée :</span>
                  <span class="quantity-box-val">${item.qteALivrer} ${item.unite}</span>
                </div>
                <div class="item-details">
                  <span class="quantity-box">Prix unitaire :</span>
                  <span class="quantity-box-val">${(item.kbetr || 0).toFixed(2)} DA</span>
                </div>
              </div>
            </div>
          `,
          )
          .join("")}

        <div class="totals">
          <div class="total-row">
            <span>Total :</span>
            <span>${totalPrice.toFixed(2)} DA</span>
          </div>
        </div>

        <div class="footer">
          <div>Merci pour votre confiance</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Génère le contenu HTML d'un reçu d'encaissement au format thermique (80mm).
 * Fonction pure : ne dépend d'aucun state React, prend toutes ses données en paramètre.
 *
 * @param {object} encaissementData - { Id, Client, clientName, DateEncaissement, ModePaiement, Reference, Montant }
 * @param {object} userData - { magasin, code }
 */
export const generateEncaissementThermalPDFContent = (
  encaissementData,
  userData,
) => {
  const currentDate = new Date().toLocaleDateString("fr-FR");
  const currentTime = new Date().toLocaleTimeString("fr-FR");

  const formatEncaissementDate = (dateSAP) => {
    if (!dateSAP) return currentDate;
    try {
      if (!dateSAP.includes("/Date(")) {
        return new Date(dateSAP).toLocaleDateString("fr-FR");
      }
      const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);
      if (timestampMatch && timestampMatch.length >= 2) {
        return new Date(parseInt(timestampMatch[1])).toLocaleDateString(
          "fr-FR",
        );
      }
    } catch (error) {
      console.error("Erreur format date:", error);
    }
    return currentDate;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reçu d'Encaissement</title>
      <style>
        @page { size: 80mm auto; margin: 2mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 18px;
          line-height: 1.2;
          width: 76mm;
          color: #000;
          background: white;
        }
        .receipt-container { width: 100%; padding: 2mm; }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 3mm;
          margin-bottom: 3mm;
        }
        .document-title {
          font-size: 20px;
          font-weight: bold;
          margin: 2mm 0;
          text-transform: uppercase;
        }
        .encaissement-number {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 1mm;
        }
        .info-section { margin: 3mm 0; font-size: 16px; }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
          align-items: flex-end;
        }
        .info-label { font-weight: bold; min-width: 25mm; font-size: 16px; }
        .info-value { text-align: right; flex: 1; word-wrap: break-word; font-size: 16px; }
        .separator { border-top: 1px dashed #000; margin: 3mm 0; }
        .payment-section {
          margin: 3mm 0;
          padding: 2mm 0;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }
        .payment-title {
          font-weight: bold;
          text-align: center;
          font-size: 18px;
          margin-bottom: 2mm;
          text-transform: uppercase;
        }
        .payment-details { margin: 2mm 0; }
        .payment-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
          font-size: 16px;
        }
        .payment-label { font-weight: bold; }
        .payment-value { font-weight: bold; text-align: right; }
        .amount-section {
          text-align: center;
          margin: 3mm 0;
          padding: 2mm;
          border: 2px solid #000;
        }
        .amount-label { font-size: 16px; margin-bottom: 1mm; }
        .amount-value { font-size: 24px; font-weight: bold; color: #000; }
        .footer {
          text-align: center;
          margin-top: 5mm;
          padding-top: 3mm;
          border-top: 1px dashed #000;
          font-size: 16px;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="document-title">Reçu d'Encaissement</div>
          <div class="encaissement-number">N° ${encaissementData.Id}</div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${currentDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Heure:</span>
            <span class="info-value">${currentTime}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Client:</span>
            <span class="info-value">${encaissementData.Client || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Nom:</span>
            <span class="info-value">${encaissementData.clientName || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Commercial:</span>
            <span class="info-value">${userData?.magasin || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date Encaissement:</span>
            <span class="info-value">${formatEncaissementDate(encaissementData.DateEncaissement)}</span>
          </div>
        </div>

        <div class="separator"></div>

        <div class="payment-section">
          <div class="payment-title">Détails du Paiement</div>
          <div class="payment-details">
            <div class="payment-row">
              <span class="payment-label">Mode de paiement:</span>
              <span class="payment-value">${encaissementData.ModePaiement || "ESPECE"}</span>
            </div>
            ${
              encaissementData.Reference
                ? `<div class="payment-row">
                    <span class="payment-label">Référence:</span>
                    <span class="payment-value">${encaissementData.Reference}</span>
                  </div>`
                : ""
            }
          </div>
        </div>

        <div class="amount-section">
          <div class="amount-label">Montant Encaissé</div>
          <div class="amount-value">${parseFloat(
            encaissementData.Montant || 0,
          ).toLocaleString("fr-DZ", {
            style: "currency",
            currency: "DZD",
          })}</div>
        </div>

        <div class="footer">
          <div>Merci pour votre confiance</div>
        </div>
      </div>
    </body>
    </html>
  `;
};
