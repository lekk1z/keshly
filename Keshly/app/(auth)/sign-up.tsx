import { supabase } from "@/lib/supabase";
import { Button, Input } from "@rneui/themed";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithEmail() {
    if (!name.trim()) {
      Alert.alert("Please enter your name");
      return;
    }

    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      Alert.alert(error.message);
    } else if (!session) {
      Alert.alert("Please check your inbox for email verification!");
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Ime i Prezime"
          onChangeText={(text) => setName(text)}
          value={name}
          placeholder="Marko Marković"
          autoCapitalize="words"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Email"
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Lozinka"
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize="none"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title="Registrujte se"
          disabled={loading}
          onPress={() => signUpWithEmail()}
        />
      </View>

      <View style={styles.signInContainer}>
        <Text style={styles.signInText}>Već imate nalog? </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.signInLink}>Prijavite se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
    padding: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: "stretch",
  },
  mt20: {
    marginTop: 20,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signInText: {
    color: "#666",
  },
  signInLink: {
    color: "#2089dc",
    fontWeight: "bold",
  },
});
