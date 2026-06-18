import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { WebView } from "react-native-webview";

const PDFViewerComponent = ({ pdfBlob, pdfUrl: initialPdfUrl }) => {
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl || null);
  const [loading, setLoading] = useState(!initialPdfUrl);

  useEffect(() => {
    if (pdfBlob && !initialPdfUrl) {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          setPdfUrl(reader.result);
          setLoading(false);
        };
        reader.onerror = (error) => {
          console.error("Erreur de lecture du PDF:", error);
          setLoading(false);
        };
        reader.readAsDataURL(pdfBlob);
      } catch (error) {
        console.error("Erreur lors du traitement du PDF:", error);
        setLoading(false);
      }
    }
  }, [pdfBlob, initialPdfUrl]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!pdfUrl) {
    return (
      <View style={styles.errorContainer}>
        <Text>Impossible de charger le PDF</Text>
      </View>
    );
  }

  return (
    <WebView
      originWhitelist={["*"]}
      source={{
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body, html { margin: 0; height: 100%; overflow: hidden; }
                iframe { width: 100%; height: 100%; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${pdfUrl}" type="application/pdf"></iframe>
            </body>
          </html>
        `,
      }}
      style={styles.webview}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  webview: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default PDFViewerComponent;
