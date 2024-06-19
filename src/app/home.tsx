import { drizzle } from "drizzle-orm/expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "react-native";
import * as productSchema from "../database/schemas/product-schema";
import { asc, eq, like } from "drizzle-orm";

type Data = {
  id: number;
  name: string;
};

export default function Home() {
  const [name, setName] = useState("");
  const [data, setData] = useState<Data[]>([]);
  const [search, setSearch] = useState("");
  const database = useSQLiteContext();
  const db = drizzle(database, { schema: productSchema });

  const height = StatusBar.currentHeight ?? 0;

  async function fetchProducts() {
    try {
      const response = await db.query.product.findMany({
        where: like(productSchema.product.name, `%${search}%`),
        orderBy: [asc(productSchema.product.name)],
      });

      console.table(response);

      setData(response);
    } catch (error) {
      console.log(error);
    }
  }

  async function add() {
    try {
      const response = await db.insert(productSchema.product).values({
        name,
      });

      Alert.alert("Cadastrado com o ID" + response.lastInsertRowId);
      setName("");

      await fetchProducts();
    } catch (error) {
      console.log(error);
    }
  }

  async function remove(id: number) {
    try {
      Alert.alert("Remover", "Deseja remover ?", [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {
            await db
              .delete(productSchema.product)
              .where(eq(productSchema.product.id, id));

            await fetchProducts();
          },
          style: "destructive",
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  }

  async function show(id: number) {
    try {
      const product = await db.query.product.findFirst({
        where: eq(productSchema.product.id, id),
      });

      if (product) {
        Alert.alert(
          `Product ID: ${product.id} - cadastrado com nome ${product.name}`
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [search]);

  return (
    <View style={{ flex: 1, padding: height, gap: 16 }}>
      <TextInput
        placeholder="Type here..."
        style={{
          height: 54,
          borderWidth: 1,
          borderRadius: 7,
          borderColor: "#999",
          paddingHorizontal: 16,
        }}
        value={name}
        onChangeText={setName}
      />

      <Button title="Submit" onPress={add} />

      <TextInput
        placeholder="Search"
        style={{
          height: 54,
          borderWidth: 1,
          borderRadius: 7,
          borderColor: "#999",
          paddingHorizontal: 16,
        }}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={data}
        renderItem={({ item }) => (
          <Pressable
            style={{ padding: 16, borderWidth: 1, borderRadius: 7 }}
            onLongPress={() => remove(item.id)}
            onPress={() => show(item.id)}
          >
            <Text>{item.name}</Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => <Text>No data</Text>}
        contentContainerStyle={{ gap: 16 }}
      />
    </View>
  );
}
