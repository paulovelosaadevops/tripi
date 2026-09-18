import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import { colors, spacing } from "@tripi/design-tokens";

export default function Index() {
  const { t } = useTranslation();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Text style={[styles.title, { color: palette.text }]}>Tripi</Text>
      <Text style={[styles.subtitle, { color: palette.text }]}>
        {t("foundation.ready")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
});
