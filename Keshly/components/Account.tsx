import { supabase } from "@/lib/supabase";
import { Button, Input } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const confirmationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, []);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`full_name`)
        .eq("id", session?.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFullName(data.full_name);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({ fullName }: { fullName: string }) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        id: session?.user.id,
        full_name: fullName,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }

      setShowConfirmation(true);
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
      confirmationTimeoutRef.current = setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input label="Email" value={session?.user?.email} disabled />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Ime i Prezime"
          value={fullName || ""}
          onChangeText={(text) => setFullName(text)}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title={loading ? "Loading ..." : "Ažurirajte podatke"}
          onPress={() => updateProfile({ fullName: fullName || "" })}
          disabled={loading}
        />
      </View>
      {showConfirmation ? (
        <Text style={styles.confirmationText}>Podaci su uspešno ažurirani.</Text>
      ) : null}

      <View style={styles.verticallySpaced}>
        <Button title="Odjavite se" onPress={() => supabase.auth.signOut()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: "stretch",
  },
  mt20: {
    marginTop: 20,
  },
  confirmationText: {
    color: "#16A34A",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
});
