import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Expo automatically injects EXPO_PUBLIC_* vars into process.env
const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
