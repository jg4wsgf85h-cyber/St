/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VideoItem, Order, BrandingSettings, SectionTitle, WhitelistItem } from './types';

// Converts a Blob/File to a Base64 data URL for persistence
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// SECURE ADMIN PASSWORD TOKEN persistence & header hooks
let adminPasswordToken: string = localStorage.getItem('omerta_admin_token') || '';

export function setAdminPasswordToken(password: string) {
  adminPasswordToken = password;
  localStorage.setItem('omerta_admin_token', password);
}

export function getAdminPasswordToken() {
  return adminPasswordToken;
}

export function clearAdminPasswordToken() {
  adminPasswordToken = '';
  localStorage.removeItem('omerta_admin_token');
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const res = await fetch('/api/verify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      setAdminPasswordToken(password);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[AUTH DB] Error validating passcode with server:', err);
    return false;
  }
}

export function getAdminHeaders(additional: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...additional };
  const token = getAdminPasswordToken();
  if (token) {
    headers['X-Admin-Password'] = token;
  }
  return headers;
}

// 1. PRODUCTS CENTRAL API
export async function getProducts(): Promise<VideoItem[]> {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to retrieve products from server');
    return await res.json();
  } catch (err) {
    console.warn('Backend server unreachable, trying client fallback:', err);
    // If server is unreachable, try to load from client localStorage or defaults
    const local = localStorage.getItem('omerta_fallback_products');
    if (local) {
      return JSON.parse(local);
    }
    return [];
  }
}

export async function addProduct(product: VideoItem, videoBlob?: Blob, photoBlob?: Blob): Promise<void> {
  const payload = { ...product };

  // If a file was uploaded as raw blob, upload it to Server to store as static asset
  if (videoBlob) {
    try {
      const b64 = await blobToBase64(videoBlob);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ filename: 'video.mp4', base64: b64 })
      });
      if (res.ok) {
        const d = await res.json();
        payload.videoUrl = d.url;
      }
    } catch (e) {
      console.error('Core video upload error:', e);
    }
  } else if (payload.videoUrl && payload.videoUrl.startsWith('data:')) {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ filename: 'video.mp4', base64: payload.videoUrl })
      });
      if (res.ok) {
        const d = await res.json();
        payload.videoUrl = d.url;
      }
    } catch (e) {
      console.error('Base64 video upload error:', e);
    }
  }

  if (photoBlob) {
    try {
      const b64 = await blobToBase64(photoBlob);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ filename: 'image.jpg', base64: b64 })
      });
      if (res.ok) {
        const d = await res.json();
        payload.thumbnailUrl = d.url;
      }
    } catch (e) {
      console.error('Core photo upload error:', e);
    }
  } else if (payload.thumbnailUrl && payload.thumbnailUrl.startsWith('data:')) {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ filename: 'image.jpg', base64: payload.thumbnailUrl })
      });
      if (res.ok) {
        const d = await res.json();
        payload.thumbnailUrl = d.url;
      }
    } catch (e) {
      console.error('Base64 photo upload error:', e);
    }
  }

  // Also upload any base64 additional photos
  if (payload.additionalPhotos && payload.additionalPhotos.length > 0) {
    const uploadedPhotos: string[] = [];
    for (const photo of payload.additionalPhotos) {
      if (photo && photo.startsWith('data:')) {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ filename: 'additional.jpg', base64: photo })
          });
          if (res.ok) {
            const d = await res.json();
            uploadedPhotos.push(d.url);
          } else {
            uploadedPhotos.push(photo);
          }
        } catch (e) {
          console.error('Base64 additional photo upload error:', e);
          uploadedPhotos.push(photo);
        }
      } else {
        uploadedPhotos.push(photo);
      }
    }
    payload.additionalPhotos = uploadedPhotos;
  }

  const res = await fetch('/api/products', {
    method: 'POST',
    headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('Error saving product on server');
  }

  // Sync client-side fallback list
  try {
    const updatedList = await getProducts();
    localStorage.setItem('omerta_fallback_products', JSON.stringify(updatedList));
  } catch (e) {}
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: getAdminHeaders()
  });

  if (!res.ok) {
    throw new Error('Error deleting product from server');
  }

  // Sync client-side fallback list
  try {
    const updatedList = await getProducts();
    localStorage.setItem('omerta_fallback_products', JSON.stringify(updatedList));
  } catch (e) {}
}

// Left as an empty pass-through helper for backward compatibility, because all URL resolutions are pre-computed on upload
export function resolveMediaUrls(product: any): VideoItem {
  return product as VideoItem;
}

// 2. ORDERS JOURNAL API
export async function getOrders(): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders', {
      headers: getAdminHeaders()
    });
    if (!res.ok) throw new Error('Failed to retrieve orders');
    return await res.json();
  } catch (err) {
    console.warn('Backend server orders query unreachable, using local fallback:', err);
    const local = localStorage.getItem('omerta_fallback_orders');
    return local ? JSON.parse(local) : [];
  }
}

export async function createOrder(order: Order): Promise<void> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });

  if (!res.ok) {
    throw new Error('Failed to write order on server');
  }

  // Also write to local storage as fallback
  try {
    const localList = await getOrders();
    localStorage.setItem('omerta_fallback_orders', JSON.stringify(localList));
  } catch (e) {}
}

export async function updateOrderStatus(orderId: string, status: 'pending' | 'completed' | 'cancelled'): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    throw new Error('Failed to update order status');
  }

  try {
    const localList = await getOrders();
    localStorage.setItem('omerta_fallback_orders', JSON.stringify(localList));
  } catch (e) {}
}

export async function deleteOrder(orderId: string): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'DELETE',
    headers: getAdminHeaders()
  });

  if (!res.ok) {
    throw new Error('Failed to purge order');
  }

  try {
    const localList = await getOrders();
    localStorage.setItem('omerta_fallback_orders', JSON.stringify(localList));
  } catch (e) {}
}

export async function getBrandingSettings(): Promise<BrandingSettings> {
  const defaultTitles: SectionTitle[] = [
    { id: '1', text: 'TANT DE DEGRÉS D\'EXCELLENCE', category: 'All', size: 'L', color: '#D4AF37', enabled: true, order: 1 },
    { id: '2', text: 'NOS DOUBLES FILTRÉS D\'ÉLITE', category: 'Double Filtré', size: 'L', color: '#D4AF37', enabled: true, order: 2 },
    { id: '3', text: 'NOS SPECIAUX FROZEN SIFT', category: 'Frozen Sift', size: 'L', color: '#D4AF37', enabled: true, order: 3 },
    { id: '4', text: 'RÉSERVE BELDIA TRADITIONNELLE', category: 'Beldi', size: 'L', color: '#D4AF37', enabled: true, order: 4 }
  ];

  try {
    const res = await fetch('/api/settings', {
      headers: getAdminHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    const data = await res.json();
    if (!data.sectionTitles) {
      data.sectionTitles = defaultTitles;
    }
    return data;
  } catch (e) {
    console.warn('Fallback settings logic:', e);
    return {
      introBgUrl: '',
      launchScreenUrl: '',
      homepageHeroBgUrl: '',
      logoUrl: '',
      introStatusLine: 'HASH\'N FLASH MOCRO — LA RÉSERVE PRIVÉE',
      sectionTitles: defaultTitles
    };
  }
}

export async function updateBrandingSettings(settings: Partial<BrandingSettings>): Promise<BrandingSettings> {
  const payload = { ...settings };
  const keys: (keyof BrandingSettings)[] = ['introBgUrl', 'launchScreenUrl', 'homepageHeroBgUrl', 'logoUrl'];

  for (const key of keys) {
    const val = payload[key];
    if (typeof val === 'string' && val.startsWith('data:')) {
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ filename: `${key}.jpg`, base64: val })
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          payload[key] = data.url;
        }
      } catch (e) {
        console.error(`Error uploading branding ${key}:`, e);
      }
    }
  }

  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update brand visuals');
  const d = await res.json();
  return d.settings;
}

export async function uploadFileRaw(file: File): Promise<string> {
  // Try raw binary uploading first: it avoids massive base64 string overhead in memory, protecting mobile webviews and preventing crashes/timeouts
  try {
    const res = await fetch('/api/upload-raw', {
      method: 'POST',
      headers: getAdminHeaders({
        'Content-Type': 'application/octet-stream',
        'x-filename': encodeURIComponent(file.name)
      }),
      body: file
    });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    const errText = await res.text();
    console.warn('Raw binary upload failed, trying base64 fallback...', errText);
  } catch (err) {
    console.warn('Raw binary upload exception, trying base64 fallback...', err);
  }

  // Base64 fallback for browsers that do not support streaming request bodies fully
  try {
    const b64 = await blobToBase64(file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ filename: file.name, base64: b64 })
    });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    const errText = await res.text();
    throw new Error(`Upload failed: ${errText}`);
  } catch (err: any) {
    throw new Error(`Upload failed: ${err.message || err}`);
  }
}

// 5. WHITELIST MANAGEMENT API
export async function getWhitelist(): Promise<WhitelistItem[]> {
  try {
    const res = await fetch('/api/access-control', {
      headers: getAdminHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch whitelist from server');
    return await res.json();
  } catch (err) {
    console.warn('Backend server access-control query unreachable:', err);
    return [];
  }
}

export async function addWhitelistItem(item: Omit<WhitelistItem, 'id'> & { id?: string }): Promise<WhitelistItem> {
  const res = await fetch('/api/access-control', {
    method: 'POST',
    headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(item)
  });
  if (!res.ok) {
    throw new Error('Failed to add whitelist item to server');
  }
  const data = await res.json();
  return data.entry;
}

export async function deleteWhitelistItem(id: string): Promise<void> {
  const res = await fetch(`/api/access-control/${id}`, {
    method: 'DELETE',
    headers: getAdminHeaders()
  });
  if (!res.ok) {
    throw new Error('Failed to delete whitelist item from server');
  }
}


