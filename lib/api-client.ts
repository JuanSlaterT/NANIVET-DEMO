// API Client - Conexión frontend al backend NANIVET
// Transforma camelCase (frontend) a snake_case (backend) y usa sesión HttpOnly.

import { startLoading, stopLoading } from './loading-manager';
import { toast } from 'sonner';

// Las llamadas del navegador pasan por el mismo origen para que Safari no
// trate las cookies HttpOnly de autenticacion como cookies de terceros.
const API_BASE = '/api';

// ==================== TYPES ====================
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field?: string; message: string }>;
  requestId?: string;
}

type ParsedResponseBody = {
  value: any;
  rawText: string;
};

// ==================== AUTH ====================
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
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

// ==================== TOKEN REFRESH ====================
let isRefreshing = false;
let sessionExpiredNotified = false;
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
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const parsed = await parseResponseBody(response);
    const data = parsed.value;

    if (!response.ok || data.error) {
      throw new Error(extractError(data, parsed.rawText, response.status).message);
    }

    if (!data.data?.user) {
      throw new Error('El servidor no devolvió una sesión renovada');
    }
    sessionExpiredNotified = false;
    return 'cookie-session';
  } catch (error) {
    // Clear auth on refresh failure
    throw error;
  }
}

function notifySessionExpired(): void {
  if (typeof window === 'undefined' || sessionExpiredNotified) return;
  sessionExpiredNotified = true;
  window.dispatchEvent(new CustomEvent('nanivet:session-expired'));
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

const inFlightGetRequests = new Map<string, Promise<ApiResponse<unknown>>>();
const getResponseCache = new Map<string, {
  response: ApiResponse<unknown>;
  expiresAt: number;
}>();
const GET_CACHE_TTL_MS = 10_000;
const MUTATION_LOADING_DELAY_MS = 180;
let cacheGeneration = 0;
let activeMutations = 0;
let nextCachePruneAt = 0;

function cloneApiResponse<T>(response: ApiResponse<T>): ApiResponse<T> {
  if (typeof structuredClone === 'function') {
    return structuredClone(response);
  }

  // API responses originate as JSON, so this fallback preserves their data
  // shape while keeping cached values isolated from consumer mutations.
  return JSON.parse(JSON.stringify(response)) as ApiResponse<T>;
}

function invalidateGetCache(): void {
  cacheGeneration += 1;
  getResponseCache.clear();
  inFlightGetRequests.clear();
  nextCachePruneAt = 0;
}

function pruneExpiredGetCache(now: number): void {
  if (now < nextCachePruneAt) return;

  for (const [key, cached] of Array.from(getResponseCache.entries())) {
    if (cached.expiresAt <= now) {
      getResponseCache.delete(key);
    }
  }
  nextCachePruneAt = now + GET_CACHE_TTL_MS;
}

/** Parse JSON when present while preserving useful non-JSON backend messages. */
async function parseResponseBody(response: Response): Promise<ParsedResponseBody> {
  const text = await response.text();
  if (!text.trim()) return { value: {}, rawText: '' };

  try {
    return { value: JSON.parse(text), rawText: text };
  } catch {
    return { value: {}, rawText: text };
  }
}

function asUsefulMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const message = value.trim();
  if (!message || /<\/?[a-z][\s\S]*>/i.test(message)) return null;
  return message.slice(0, 500);
}

/** Supports the documented { error: { code, message } } contract and common exception shapes. */
function extractError(body: any, rawText: string, status: number): ApiError {
  const errorObject = body?.error;
  const collections = [body?.errors, errorObject?.errors, body?.issues, errorObject?.issues, errorObject?.details]
    .filter(Array.isArray)
    .flat();
  const detailMessages = collections
    .map((item: any) => {
      const detail = asUsefulMessage(item?.message ?? item?.msg ?? item);
      const field = asUsefulMessage(item?.field);
      return detail && field ? `${field}: ${detail}` : detail;
    })
    .filter((message: string | null): message is string => Boolean(message));
  const message =
    (detailMessages.length > 0 ? detailMessages.join('. ') : null) ||
    asUsefulMessage(errorObject?.message) ||
    asUsefulMessage(errorObject) ||
    asUsefulMessage(body?.message) ||
    asUsefulMessage(rawText) ||
    ({
      400: 'La solicitud contiene datos inválidos.',
      401: 'No fue posible validar tu sesión.',
      403: 'No tienes permisos para realizar esta acción.',
      404: 'No se encontró el recurso solicitado.',
      409: 'La operación entra en conflicto con información existente.',
      413: 'El contenido enviado supera el tamaño permitido.',
      422: 'No fue posible validar la información enviada.',
      429: 'Se realizaron demasiadas solicitudes. Intenta nuevamente en unos minutos.',
      500: 'El servidor encontró un problema inesperado.',
      502: 'El servicio no está disponible temporalmente.',
      503: 'El servicio no está disponible temporalmente.',
      504: 'El servidor tardó demasiado en responder.',
    } as Record<number, string>)[status] ||
    `La petición falló (HTTP ${status}).`;

  return {
    code: asUsefulMessage(errorObject?.code) || asUsefulMessage(body?.code) || `HTTP_${status}`,
    message,
    details: Array.isArray(errorObject?.details) ? errorObject.details : undefined,
    requestId: asUsefulMessage(errorObject?.requestId) || undefined,
  };
}

function requestPath(url: string): string {
  try {
    return new URL(url, API_BASE).pathname;
  } catch {
    return url;
  }
}

function requestContext(method: string, url: string): string {
  const path = requestPath(url);
  if (/\/confirmar$/.test(path)) return 'confirmar la cita';
  if (/\/cancelar$/.test(path)) return 'cancelar la cita';
  if (/\/reprogramar$/.test(path)) return 'reprogramar la cita';
  if (/\/revocar-consentimiento$/.test(path)) return 'revocar el consentimiento';
  if (/\/alta$/.test(path)) return 'registrar el alta';
  if (/\/administrar$/.test(path)) return 'registrar la toma';
  if (/\/responder$/.test(path)) return 'enviar la respuesta';
  if (path.endsWith('/auth/login')) return 'iniciar sesión';
  if (path.includes('/ia/resumir-historia')) return 'generar el resumen clínico';
  if (path.includes('/ia/notas-a-soap')) return 'convertir las notas a SOAP';
  if (path.includes('/ia/redactar-mensaje')) return 'redactar el mensaje';
  if (path.includes('/ia/diferenciales')) return 'generar los diagnósticos diferenciales';

  const resourceKey = path.split('/').filter(Boolean).find(segment => segment !== 'api') || 'datos';
  const resources: Record<string, { singular: string; plural: string }> = {
    veterinarios: { singular: 'bloqueo de horario', plural: 'veterinarios y horarios' },
    staff: { singular: 'miembro del personal', plural: 'personal' },
    clientes: { singular: 'cliente', plural: 'clientes' },
    mascotas: { singular: 'paciente', plural: 'pacientes' },
    citas: { singular: 'cita', plural: 'citas' },
    casos: { singular: 'caso clínico', plural: 'casos clínicos' },
    vacunas: { singular: 'vacuna', plural: 'vacunas' },
    tratamientos: { singular: 'tratamiento', plural: 'tratamientos' },
    desparasitaciones: { singular: 'desparasitación', plural: 'desparasitaciones' },
    cirugias: { singular: 'cirugía', plural: 'cirugías' },
    examenes: { singular: 'examen', plural: 'exámenes' },
    hospitalizaciones: { singular: 'hospitalización', plural: 'hospitalizaciones' },
    medicaciones: { singular: 'medicación', plural: 'medicaciones' },
    plantillas: { singular: 'plantilla', plural: 'plantillas' },
    puntuaciones: { singular: 'puntuación', plural: 'puntuaciones' },
    'catalogo-vacunas': { singular: 'tipo de vacuna', plural: 'catálogo de vacunas' },
    'catalogo-desparasitacion': { singular: 'producto de desparasitación', plural: 'catálogo de desparasitación' },
  };
  const resource = resources[resourceKey] || { singular: 'registro', plural: 'datos solicitados' };
  if (method === 'GET') return `cargar ${resource.plural}`;
  if (method === 'DELETE') return `eliminar el ${resource.singular}`;
  if (method === 'PUT' || method === 'PATCH') return `actualizar el ${resource.singular}`;
  return `guardar el ${resource.singular}`;
}

function successMessage(method: string, url: string, body: any): string {
  const backendMessage = asUsefulMessage(body?.data?.message) || asUsefulMessage(body?.message);
  if (backendMessage) return backendMessage;

  const path = requestPath(url);
  if (/\/confirmar$/.test(path)) return 'Cita confirmada correctamente.';
  if (/\/cancelar$/.test(path)) return 'Cita cancelada correctamente.';
  if (/\/reprogramar$/.test(path)) return 'Cita reprogramada correctamente.';
  if (/\/revocar-consentimiento$/.test(path)) return 'Consentimiento revocado correctamente.';
  if (/\/alta$/.test(path)) return 'Alta registrada correctamente.';
  if (/\/administrar$/.test(path)) return 'Toma registrada correctamente.';
  if (/\/responder$/.test(path)) return 'Respuesta enviada correctamente.';
  if (path.endsWith('/auth/login')) return 'Sesión iniciada correctamente.';
  const context = requestContext(method, url);
  return `${context.charAt(0).toUpperCase()}${context.slice(1)}: operación completada correctamente.`;
}

function showApiError(error: ApiError, method: string, url: string, status?: number): void {
  if (typeof window === 'undefined') return;
  // A 404 is often used as an existence check by repositories. Detail pages
  // already render their own not-found state, so avoid a duplicate toast.
  if (method === 'GET' && status === 404) return;
  const context = requestContext(method, url);
  const code = error.code && !error.code.startsWith('HTTP_') ? ` Código: ${error.code}.` : '';
  const reference = error.requestId ? ` Referencia: ${error.requestId}.` : '';
  toast.error(error.message, {
    id: `api-error:${method}:${requestPath(url)}:${error.code}:${error.message}`,
    description: `No se pudo ${context}.${code}${reference}`,
    duration: 7000,
  });
  window.dispatchEvent(new CustomEvent('nanivet:api-error', {
    detail: { error, method, path: requestPath(url), context, status },
  }));
}

function showApiSuccess(method: string, url: string, body: any): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nanivet:api-success'));
  }
  if (typeof window === 'undefined' || ['GET', 'HEAD', 'OPTIONS'].includes(method)) return;
  toast.success(successMessage(method, url, body), {
    id: `api-success:${method}:${requestPath(url)}`,
  });
}

function buildHeaders(
  headersInit: HeadersInit | undefined,
  token: string | null,
  body?: BodyInit | null,
): Headers {
  const headers = new Headers(headersInit);
  headers.delete('X-Nanivet-Suppress-Feedback');
  headers.delete('X-Nanivet-Suppress-Loading');

  // The browser must generate the multipart boundary for FormData uploads.
  // Setting application/json here would make Multer receive an empty request.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && token !== 'cookie-session') {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

async function fetchWithRetry(url: string, options: RequestInit, method: string): Promise<Response> {
  const attempts = method === 'GET' ? 3 : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === attempts - 1) return response;

      const retryAfter = Number(response.headers.get('Retry-After'));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 5000)
        : 350 * (2 ** attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || (error instanceof DOMException && error.name === 'AbortError')) throw error;
      await new Promise(resolve => setTimeout(resolve, 350 * (2 ** attempt)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('No fue posible completar la solicitud');
}

/** Execute one API request with auth, refresh/retry and response transformation. */
async function executeFetchApi<T>(
  url: string,
  options: RequestInit,
  token: string | null,
  isMutation: boolean,
): Promise<ApiResponse<T>> {
  const optionHeaders = new Headers(options.headers);
  const suppressFeedback = optionHeaders.get('X-Nanivet-Suppress-Feedback') === 'true';
  const suppressLoading = optionHeaders.get('X-Nanivet-Suppress-Loading') === 'true';
  const headers = buildHeaders(options.headers, token, options.body);
  const method = (options.method || 'GET').toUpperCase();
  let loadingTimer: ReturnType<typeof setTimeout> | null = null;
  let loadingStarted = false;

  // Fast mutations should not flash a full-screen overlay. GET requests never
  // activate it because their pages already render their own loading states.
  if (isMutation && !suppressLoading && typeof window !== 'undefined') {
    loadingTimer = setTimeout(() => {
      loadingStarted = true;
      startLoading('Guardando...');
    }, MUTATION_LOADING_DELAY_MS);
  }

  try {
    const response = await fetchWithRetry(url, {
      ...options,
      headers,
      credentials: options.credentials || 'include',
    }, method);

    const parsed = await parseResponseBody(response);
    const data = parsed.value;

    // Handle token expiration: try automatic refresh
    if (response.status === 401 && ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHORIZED'].includes(data.error?.code)) {
      const newToken = await handleTokenExpired();
      
      if (newToken) {
        // Retry the request with the new token
        const retryHeaders = buildHeaders(options.headers, newToken, options.body);

        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: options.credentials || 'include',
        });

        const retryParsed = await parseResponseBody(retryResponse);
        const retryData = retryParsed.value;

        if (!retryResponse.ok) {
          const error = extractError(retryData, retryParsed.rawText, retryResponse.status);
          if (!suppressFeedback) showApiError(error, method, url, retryResponse.status);
          return { error };
        }

        if (retryData.data) {
          if (!suppressFeedback) showApiSuccess(method, url, retryData);
          return {
            data: toCamelCase(retryData.data) as T,
            meta: retryData.meta,
          };
        }

        if (!suppressFeedback) showApiSuccess(method, url, retryData);
        return retryData as ApiResponse<T>;
      } else {
        // Refresh failed, clear auth and return unauthorized
        const error = {
          code: 'SESSION_EXPIRED',
          message: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
        };
        if (!suppressFeedback) showApiError(error, method, url, 401);
        if (!suppressFeedback) notifySessionExpired();
        return { error };
      }
    }

    if (!response.ok) {
      const error = extractError(data, parsed.rawText, response.status);
      if (!suppressFeedback) showApiError(error, method, url, response.status);
      return { error };
    }

    // Transform snake_case to camelCase if we have data
    if (data.data) {
      if (!suppressFeedback) showApiSuccess(method, url, data);
      return {
        data: toCamelCase(data.data) as T,
        meta: data.meta,
      };
    }

    if (!suppressFeedback) showApiSuccess(method, url, data);
    return data as ApiResponse<T>;
  } catch (error) {
    const requestError: ApiError = error instanceof DOMException && error.name === 'AbortError'
      ? { code: 'REQUEST_ABORTED', message: 'La solicitud fue cancelada.' }
      : {
          code: 'NETWORK_ERROR',
          message: 'No se pudo conectar con el servidor. Comprueba tu conexión e intenta nuevamente.',
        };
    if (requestError.code !== 'REQUEST_ABORTED') {
      if (!suppressFeedback) showApiError(requestError, method, url);
    }
    return { error: requestError };
  } finally {
    if (loadingTimer) {
      clearTimeout(loadingTimer);
    }
    if (loadingStarted) {
      stopLoading();
    }
  }
}

/**
 * Fetch with auth header and response transformation.
 * Concurrent identical GETs share one network request and successful results
 * are cached briefly. Every caller receives its own clone so local sorting or
 * mutation cannot affect the cache or another consumer.
 */
export function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const method = (options.method || 'GET').toUpperCase();
  const token = null;
  const isGet = method === 'GET';
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (!isGet) {
    if (!isMutation) {
      return executeFetchApi<T>(url, options, token, false);
    }

    activeMutations += 1;
    invalidateGetCache();

    return executeFetchApi<T>(url, options, token, true).finally(() => {
      activeMutations = Math.max(0, activeMutations - 1);
    });
  }

  const requestKey = `${token || 'anonymous'}:${url}`;
  const now = Date.now();
  pruneExpiredGetCache(now);
  const cachedResponse = getResponseCache.get(requestKey);
  if (activeMutations === 0 && cachedResponse) {
    if (cachedResponse.expiresAt > now) {
      return Promise.resolve(
        cloneApiResponse(cachedResponse.response) as ApiResponse<T>
      );
    }
    getResponseCache.delete(requestKey);
  }

  const existingRequest = inFlightGetRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest.then(
      response => cloneApiResponse(response) as ApiResponse<T>
    );
  }

  const requestGeneration = cacheGeneration;
  const canCacheRequest = activeMutations === 0;
  const request = executeFetchApi<T>(url, options, token, false)
    .then(response => {
      if (
        !response.error &&
        canCacheRequest &&
        activeMutations === 0 &&
        requestGeneration === cacheGeneration
      ) {
        getResponseCache.set(requestKey, {
          response: cloneApiResponse(response) as ApiResponse<unknown>,
          expiresAt: Date.now() + GET_CACHE_TTL_MS,
        });
      }

      return response;
    })
    .finally(() => {
      if (inFlightGetRequests.get(requestKey) === request) {
        inFlightGetRequests.delete(requestKey);
      }
    });

  inFlightGetRequests.set(requestKey, request as Promise<ApiResponse<unknown>>);
  return request.then(response => cloneApiResponse(response));
}

// ==================== API METHODS ====================

export const api = {
  // ===== AUTH =====
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await fetchApi<AuthResponse>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.user) sessionExpiredNotified = false;
    return response;
  },

  /** Logout clears the HttpOnly cookies on the backend. */
  async logout(): Promise<void> {
    await fetchApi(`${API_BASE}/auth/logout`, { method: 'POST' });
  },

  async getUser(): Promise<ApiResponse<UserResponse>> {
    return fetchApi(`${API_BASE}/auth/me`, {
      headers: { 'X-Nanivet-Suppress-Feedback': 'true' },
    });
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

  async uploadMascotaProfile(id: string, image: File): Promise<ApiResponse<unknown>> {
    const body = new FormData();
    body.append('imagen', image);
    return fetchApi(`${API_BASE}/media/mascotas/${id}/perfil`, {
      method: 'POST',
      headers: { 'X-Nanivet-Suppress-Feedback': 'true' },
      body,
    });
  },

  async uploadMascotaRadiograph(
    id: string,
    data: { image: File; fecha: string; descripcion: string; titulo?: string; casoId?: string },
  ): Promise<ApiResponse<unknown>> {
    const body = new FormData();
    body.append('imagen', data.image);
    body.append('fecha', data.fecha);
    body.append('descripcion', data.descripcion);
    if (data.titulo) body.append('titulo', data.titulo);
    if (data.casoId) body.append('casoId', data.casoId);
    return fetchApi(`${API_BASE}/media/mascotas/${id}/radiografias`, {
      method: 'POST',
      headers: { 'X-Nanivet-Suppress-Feedback': 'true' },
      body,
    });
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

  async getSlotsOcupados(
    veterinarioId: string,
    fecha: string
  ): Promise<ApiResponse<{ ocupados: string[]; bloqueado: boolean }>> {
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

  async updateCaso(id: string, data: Record<string, unknown>, suppressFeedback = false): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/casos/${id}`, {
      method: 'PUT',
      headers: suppressFeedback ? {
        'X-Nanivet-Suppress-Feedback': 'true',
        'X-Nanivet-Suppress-Loading': 'true',
      } : undefined,
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

  async getAuditoriaMascota(mascotaId: string): Promise<ApiResponse<unknown[]>> {
    return fetchApi(`${API_BASE}/auditoria/mascota/${encodeURIComponent(mascotaId)}`);
  },

  async registerMascotaReferralExport(mascotaId: string, data: { incluyeRadiografias: boolean }): Promise<ApiResponse<unknown>> {
    return fetchApi(`${API_BASE}/auditoria/mascota/${encodeURIComponent(mascotaId)}/exportacion`, {
      method: 'POST',
      headers: { 'X-Nanivet-Suppress-Feedback': 'true' },
      body: JSON.stringify(data),
    });
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
