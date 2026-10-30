// API Client - Conexión frontend al backend NANIVET
// Transforma camelCase (frontend) a snake_case (backend) y maneja autenticación JWT

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ==================== TYPES ====================
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: { code: string; message: string };
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
}

// ==================== AUTH ====================
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    veterinario_id?: string | null;
  };
}

/** Stored auth object in localStorage */
export interface StoredAuth {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    veterinario_id?: string | null;
  };
}

export interface UserResponse {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  veterinario_id?: string | null;
}

// ==================== LOADING MANAGER ====================
// Import dynamically to avoid server-side issues
const getLoadingManager = () => {
  if (typeof window === 'undefined') return null;
  return {
    startLoading: (msg: string) => {
      try {
        const { startLoading } = require('./loading-manager');
        startLoading(msg);
      } catch {
        // Loading manager not available
      }
    },
    stopLoading: () => {
      try {
        const { stopLoading } = require('./loading-manager');
        stopLoading();
      } catch {
        // Loading manager not available
      }
    }
  };
};

// ==================== HELPER FUNCTIONS ====================

/** Convert camelCase object to snake_case */
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj === null || obj === undefined) return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/** Convert snake_case object to camelCase */
function toCamelCase(obj: Record<string, unknown> | Record<string, unknown>[]): Record<string, unknown> | Record<string, unknown>[] {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item as Record<string, unknown>)) as Record<string, unknown>[];
  }
  if (obj === null || obj === undefined) return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// ==================== AUTH STORAGE ====================
const AUTH_STORAGE_KEY = 'nanivet_auth';

/** Get stored auth object (token + refreshToken + user) */
function getStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.token && parsed.refreshToken) {
        return parsed as StoredAuth;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/** Get only the access token */
function getAuthToken(): string | null {
  const auth = getStoredAuth();
  return auth?.token || null;
}

/** Get only the refresh token */
function getRefreshToken(): string | null {
  const auth = getStoredAuth();
  return auth?.refreshToken || null;
}

/** Store complete auth object */
function storeAuth(auth: StoredAuth): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch (error) {
    console.error('Error storing auth:', error);
  }
}

/** Clear stored auth */
function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// ==================== TOKEN REFRESH ====================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/** Process queued requests after refresh completes */
function processQueue(error: Error | null, token: string | null = null): void {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/** Refresh the access token using the refresh token */
async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Refresh failed');
    }

    const newToken = data.data?.token;
    if (!newToken) {
      throw new Error('No new token in response');
    }

    // Update stored auth with new token (keep same refreshToken)
    const stored = getStoredAuth();
    if (stored) {
      storeAuth({
        ...stored,
        token: newToken,
      });
    }

    return newToken;
  } catch (error) {
    // Clear auth on refresh failure
    clearAuth();
    throw error;
  }
}

/** Handle a 401/TOKEN_EXPIRED response by refreshing the token */
async function handleTokenExpired(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(token => {
      if (token) {
        return token as string;
      }
      return null;
    }).catch(() => {
      return null;
    });
  }

  isRefreshing = true;

  try {
    const newToken = await refreshAccessToken();
    processQueue(null, newToken);
    return newToken;
  } catch (error) {
    processQueue(error as Error, null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

/** Fetch with auth header and response transformation */
async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Show loading screen for API calls
  const loading = getLoadingManager();
  loading?.startLoading('Cargando...');

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Handle token expiration: try automatic refresh
    if (response.status === 401 && (data.error?.code === 'TOKEN_EXPIRED' || data.error?.code === 'UNAUTHORIZED')) {
      const newToken = await handleTokenExpired();
      
      if (newToken) {
        // Retry the request with the new token
        const retryHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        };

        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });

        const retryData = await retryResponse.json();

        if (!retryResponse.ok) {
          return {
            error: {
              code: retryData.error?.code || `HTTP_${retryResponse.status}`,
              message: retryData.error?.message || `Error ${retryResponse.status}`,
            },
          };
        }

        if (retryData.data) {
          return {
            data: toCamelCase(retryData.data) as T,
            meta: retryData.meta,
          };
        }

        return retryData as ApiResponse<T>;
      } else {
        // Refresh failed, clear auth and return unauthorized
        return {
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
          },
        };
      }
    }

    if (!response.ok) {
      return {
        error: {
          code: data.error?.code || `HTTP_${response.status}`,
          message: data.error?.message || `Error ${response.status}`,
        },
      };
    }

    // Transform snake_case to camelCase if we have data
    if (data.data) {
      return {
        data: toCamelCase(data.data) as T,
        meta: data.meta,
      };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Error de red',
      },
    };
  } finally {
    // Hide loading screen after API call completes
    loading?.stopLoading();
  }
}

// ==================== API METHODS ====================

export const api = {
  // ===== AUTH =====
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok && data.data) {
      // Store both token and refreshToken in localStorage
      storeAuth({
        token: data.data.token,
        refreshToken: data.data.refreshToken,
        user: data.data.user,
      });
      return {
        data: data.data as AuthResponse,
      };
    }

    return {
      error: data.error || { code: 'LOGIN_ERROR', message: 'Error al iniciar sesión' },
    };
  },

  /** Logout and clear all stored auth */
  async logout(): Promise<void> {
    clearAuth();
  },

  /** Get current stored auth object */
  getStoredAuth(): StoredAuth | null {
    return getStoredAuth();
  },

  async getUser(): Promise<ApiResponse<UserResponse>> {
    return fetchApi(`${API_BASE}/auth/me`);
  },

  // ===== VETERINARIOS =====
  async getVeterinarios(): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/veterinarios`);
  },

  async getVeterinarioById(id: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/veterinarios/${id}`);
  },

  async getBloqueos(veterinarioId: string): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/veterinarios/${veterinarioId}/bloqueos`);
  },

  async createBloqueo(veterinarioId: string, fecha: string, motivo: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/veterinarios/${veterinarioId}/bloqueos`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase({ fecha, motivo })),
    });
  },

  async deleteBloqueo(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/veterinarios/bloqueos/${id}`, {
      method: 'DELETE',
    });
  },

  // ===== STAFF =====
  async getStaff(): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/staff`);
  },

  async getStaffById(id: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/staff/${id}`);
  },

  async getStaffByEmail(email: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/staff/email/${encodeURIComponent(email)}`);
  },

  async createStaff(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/staff`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async updateStaff(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async toggleStaffActivo(id: string, activo: boolean): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/staff/${id}/activo`, {
      method: 'PUT',
      body: JSON.stringify({ activo }),
    });
  },

  async deleteStaff(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/staff/${id}`, {
      method: 'DELETE',
    });
  },

  // ===== CLIENTES =====
  async getClientes(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/clientes?${searchParams}`;
    return fetchApi(url);
  },

  async getClientById(id: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/clientes/${id}`);
  },

  async createClient(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/clientes`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async updateClient(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deleteClient(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/clientes/${id}`, {
      method: 'DELETE',
    });
  },

  async searchClientes(query: string): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/clientes/buscar?q=${encodeURIComponent(query)}`);
  },

  async revokeConsentimiento(id: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/clientes/${id}/revocar-consentimiento`, {
      method: 'POST',
    });
  },

  // ===== MASCOTAS =====
  async getMascotas(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/mascotas?${searchParams}`;
    return fetchApi(url);
  },

  async getMascotaById(id: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/mascotas/${id}`);
  },

  async createMascota(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/mascotas`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async updateMascota(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/mascotas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deleteMascota(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/mascotas/${id}`, {
      method: 'DELETE',
    });
  },

  async searchMascotas(query: string): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/mascotas/buscar?q=${encodeURIComponent(query)}`);
  },

  // ===== CITAS =====
  async getCitas(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/citas?${searchParams}`;
    return fetchApi(url);
  },

  async getCitaById(id: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/citas/${id}`);
  },

  async getCitaByToken(token: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/citas/token/${token}`);
  },

  async createCita(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/citas`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async updateCita(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/citas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deleteCita(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/citas/${id}`, {
      method: 'DELETE',
    });
  },

  async confirmByToken(token: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/citas/token/${token}/confirmar`, {
      method: 'POST',
    });
  },

  async cancelByToken(token: string, motivo: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/citas/token/${token}/cancelar`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },

  async rescheduleByToken(token: string, nuevaFechaHora: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/citas/token/${token}/reprogramar`, {
      method: 'POST',
      body: JSON.stringify({ nuevaFechaHora }),
    });
  },

  async getSlotsOcupados(veterinarioId: string, fecha: string): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/citas/veterinario/${veterinarioId}/slots?fecha=${fecha}`);
  },

  async getProximas(veterinarioId: string): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/citas/veterinario/${veterinarioId}/proximas`);
  },

  // ===== CASOS CLÍNICOS =====
  async getCasos(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/casos?${searchParams}`;
    return fetchApi(url);
  },

  async getCasoById(id: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/casos/${id}`);
  },

  async createCaso(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/casos`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async updateCaso(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/casos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deleteCaso(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/casos/${id}`, {
      method: 'DELETE',
    });
  },

  // ===== VACUNAS =====
  async getVacunas(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/vacunas?${searchParams}`;
    return fetchApi(url);
  },

  async createVacuna(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/vacunas`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deleteVacuna(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/vacunas/${id}`, {
      method: 'DELETE',
    });
  },

  async updateVacuna(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/vacunas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  // ===== TRATAMIENTOS =====
  async getTratamientos(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/tratamientos?${searchParams}`;
    return fetchApi(url);
  },

  async getTratamientoById(id: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/tratamientos/${id}`);
  },

  async createTratamiento(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/tratamientos`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async updateTratamiento(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/tratamientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deleteTratamiento(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/tratamientos/${id}`, {
      method: 'DELETE',
    });
  },

  // ===== DESPARASITACIONES =====
  async getDesparasitaciones(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/desparasitaciones?${searchParams}`;
    return fetchApi(url);
  },

  async getDesparasitacionById(id: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/desparasitaciones/${id}`);
  },

  async createDesparasitacion(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/desparasitaciones`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async updateDesparasitacion(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/desparasitaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deleteDesparasitacion(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/desparasitaciones/${id}`, {
      method: 'DELETE',
    });
  },

  // ===== CIRUGÍAS =====
  async getCirugias(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/cirugias?${searchParams}`;
    return fetchApi(url);
  },

  async createCirugia(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/cirugias`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deleteCirugia(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/cirugias/${id}`, {
      method: 'DELETE',
    });
  },

  // ===== EXÁMENES =====
  async getExamenes(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/examenes?${searchParams}`;
    return fetchApi(url);
  },

  async createExamen(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/examenes`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deleteExamen(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/examenes/${id}`, {
      method: 'DELETE',
    });
  },

  // ===== PESO =====
  async getPesos(mascotaId: string): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/mascotas/${mascotaId}/pesos`);
  },

  async createPeso(mascotaId: string, peso: number, fecha: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/mascotas/${mascotaId}/pesos`, {
      method: 'POST',
      body: JSON.stringify({ peso, fecha }),
    });
  },

  // ===== HOSPITALIZACIONES =====
  async getHospitalizaciones(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/hospitalizaciones?${searchParams}`;
    return fetchApi(url);
  },

  async getHospitalizacionById(id: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/hospitalizaciones/${id}`);
  },

  async createHospitalizacion(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/hospitalizaciones`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async updateHospitalizacion(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/hospitalizaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async darAltaHospitalizacion(id: string, data?: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/hospitalizaciones/${id}/alta`, {
      method: 'PUT',
      body: data ? JSON.stringify(toSnakeCase(data)) : undefined,
    });
  },

  // ===== MEDICACIONES =====
  async getMedicaciones(hospitalizacionId: string): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/hospitalizaciones/${hospitalizacionId}/medicaciones`);
  },

  async createMedicacion(hospitalizacionId: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/hospitalizaciones/${hospitalizacionId}/medicaciones`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async administrarToma(medicacionId: string, tomaId: string, horaReal: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/medicaciones/${medicacionId}/tomas/${tomaId}/administrar`, {
      method: 'PUT',
      body: JSON.stringify({ horaReal }),
    });
  },

  async deleteMedicacion(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/medicaciones/${id}`, {
      method: 'DELETE',
    });
  },

  // ===== EVOLUCIONES =====
  async getEvoluciones(hospitalizacionId: string): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/hospitalizaciones/${hospitalizacionId}/evoluciones`);
  },

  async createEvolucion(hospitalizacionId: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/hospitalizaciones/${hospitalizacionId}/evoluciones`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  // ===== AUDITORÍA =====
  async getAuditoria(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/auditoria?${searchParams}`;
    return fetchApi(url);
  },

  async getAuditoriaEntidad(entidad: string, entidadId: string): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/auditoria/entidad/${entidad}/${entidadId}`);
  },

  // ===== CAMPAÑAS =====
  async getCampanaSegmentos(): Promise<ApiResponse<Record<string, unknown>>> {
    return fetchApi(`${API_BASE}/campanas/segmentos`);
  },

  async getCampanaEnvios(segmento?: string): Promise<ApiResponse<unknown[]>> {
    const url = segmento
      ? `${API_BASE}/campanas/envios?segmento=${segmento}`
      : `${API_BASE}/campanas/envios`;
    return fetchApi(url);
  },

  // ===== PLANTILLAS =====
  async getPlantillas(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/plantillas?${searchParams}`;
    return fetchApi(url);
  },

  async getPlantillaById(id: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/plantillas/${id}`);
  },

  async createPlantilla(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/plantillas`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async updatePlantilla(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/plantillas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deletePlantilla(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/plantillas/${id}`, {
      method: 'DELETE',
    });
  },

  // ===== IA (MOCK) =====
  async iaResumirHistoria(mascotaId: string): Promise<ApiResponse<string>> {
    return fetchApi(`${API_BASE}/ia/resumir-historia`, {
      method: 'POST',
      body: JSON.stringify({ mascotaId }),
    });
  },

  async iaNotasASOAP(notas: string): Promise<ApiResponse<{ subjetivo: string; objetivo: string; analisis: string; plan: string }>> {
    return fetchApi(`${API_BASE}/ia/notas-a-soap`, {
      method: 'POST',
      body: JSON.stringify({ notas }),
    });
  },

  async iaRedactarMensaje(data: Record<string, unknown>): Promise<ApiResponse<string>> {
    return fetchApi(`${API_BASE}/ia/redactar-mensaje`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async iaDiferenciales(data: Record<string, unknown>): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/ia/diferenciales`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  // ===== BÚSQUEDA GLOBAL =====
  async searchGlobal(query: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/search/global?q=${encodeURIComponent(query)}`);
  },

  // ===== PUNTUACIONES =====
  async getPuntuaciones(params?: Record<string, string>): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}/puntuaciones?${searchParams}`;
    return fetchApi(url);
  },

  async getPuntuacionByCita(citaId: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/puntuaciones/cita/${citaId}`);
  },

  async createPuntuacion(citaId: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/puntuaciones/cita/${citaId}`, {
      method: 'POST',
    });
  },

  async getPuntuacionesPendientes(): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/puntuaciones/pendientes`);
  },

  async getPuntuacionesStats(): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/puntuaciones/stats`);
  },

  async getPuntuacionByToken(token: string): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/puntuaciones/token/${token}`);
  },

  async responderPuntuacion(token: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/puntuaciones/token/${token}/responder`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  // ===== CATÁLOGO VACUNAS =====
  async getCatalogoVacunas(): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/catalogo/vacunas`);
  },

  async createCatalogoVacuna(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/catalogo/vacunas`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async updateCatalogoVacuna(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/catalogo/vacunas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deleteCatalogoVacuna(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/catalogo/vacunas/${id}`, {
      method: 'DELETE',
    });
  },

  // ===== CATÁLOGO DESPARASITACIÓN =====
  async getCatalogoDesparasitacion(): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/catalogo/desparasitacion`);
  },

  async createCatalogoDesparasitacion(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/catalogo/desparasitacion`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async updateCatalogoDesparasitacion(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/catalogo/desparasitacion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    });
  },

  async deleteCatalogoDesparasitacion(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`${API_BASE}/catalogo/desparasitacion/${id}`, {
      method: 'DELETE',
    });
  },
};

export default api;
