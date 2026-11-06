"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";

async function serverApi() {

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  const instance = axios.create({
    // Full backend base URL, e.g. http://localhost:4000/api/v1 (the backend's routes are under /api/v1)
    baseURL: process.env.NEXT_BASE_URL,
    timeout: 60000,
    withCredentials: true,
  });

  if (token) {
    instance.defaults.headers.Authorization = `Bearer ${token}`;
  }

  return instance;
}

export default serverApi;