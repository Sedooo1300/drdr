import { NextRequest, NextResponse } from 'next/server';

// ============================================
// SYNC API - Professional Implementation
// ============================================

// Upstash Redis Configuration
const UPSTASH_URL = process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Check configuration
function isConfigured(): boolean {
  return !!(UPSTASH_URL && UPSTASH_TOKEN);
}

// Upstash operations
async function redisGet(key: string): Promise<{ data: string; lastUpdated: number } | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    const json = await res.json();
    
    if (json.result) {
      return JSON.parse(json.result);
    }
    return null;
  } catch (e) {
    console.error('Redis GET error:', e);
    return null;
  }
}

async function redisSet(key: string, data: string, lastUpdated: number): Promise<boolean> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return false;
  
  try {
    const value = JSON.stringify({ data, lastUpdated });
    const encoded = encodeURIComponent(value);
    
    // Set with 24 hour expiry
    const res = await fetch(`${UPSTASH_URL}/set/${key}/${encoded}/EX/86400`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    const json = await res.json();
    
    return json.result === 'OK';
  } catch (e) {
    console.error('Redis SET error:', e);
    return false;
  }
}

// Memory fallback (only for local development)
const memoryStore = new Map<string, { data: string; lastUpdated: number }>();

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of memoryStore.entries()) {
      if (now - val.lastUpdated > 86400000) {
        memoryStore.delete(key);
      }
    }
  }, 300000);
}

function getRoomKey(code: string): string {
  return `room:${code.toUpperCase()}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const room = searchParams.get('room');

  // Status check
  if (action === 'status') {
    return NextResponse.json({
      success: true,
      configured: isConfigured(),
      mode: isConfigured() ? 'upstash' : 'memory',
    });
  }

  // Get room data
  if (action === 'sync' && room) {
    const key = getRoomKey(room);
    
    if (isConfigured()) {
      const stored = await redisGet(key);
      if (stored) {
        return NextResponse.json({
          success: true,
          data: stored.data,
          lastUpdated: stored.lastUpdated,
        });
      }
      return NextResponse.json({
        success: false,
        message: 'الغرفة غير موجودة',
      });
    } else {
      const stored = memoryStore.get(key);
      if (stored) {
        return NextResponse.json({
          success: true,
          data: stored.data,
          lastUpdated: stored.lastUpdated,
        });
      }
      return NextResponse.json({
        success: false,
        message: 'الغرفة غير موجودة',
      });
    }
  }

  // Check room exists
  if (action === 'check' && room) {
    const key = getRoomKey(room);
    
    if (isConfigured()) {
      const exists = await redisGet(key);
      return NextResponse.json({ success: true, exists: !!exists });
    } else {
      return NextResponse.json({ success: true, exists: memoryStore.has(key) });
    }
  }

  return NextResponse.json({ success: false, message: 'إجراء غير صحيح' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, room, data } = body;
    
    if (!room) {
      return NextResponse.json({ success: false, message: 'كود الغرفة مطلوب' });
    }
    
    const key = getRoomKey(room);
    const now = Date.now();

    // Create room
    if (action === 'create') {
      if (isConfigured()) {
        const success = await redisSet(key, data || '', now);
        if (success) {
          return NextResponse.json({
            success: true,
            message: 'تم إنشاء الغرفة',
            lastUpdated: now,
          });
        }
        return NextResponse.json({
          success: false,
          message: 'فشل الاتصال',
        });
      } else {
        memoryStore.set(key, { data: data || '', lastUpdated: now });
        return NextResponse.json({
          success: true,
          message: 'تم إنشاء الغرفة',
          lastUpdated: now,
        });
      }
    }

    // Join room
    if (action === 'join') {
      if (isConfigured()) {
        const stored = await redisGet(key);
        if (stored) {
          return NextResponse.json({
            success: true,
            data: stored.data,
            lastUpdated: stored.lastUpdated,
          });
        }
        return NextResponse.json({
          success: false,
          message: 'كود الغرفة غير صحيح',
        });
      } else {
        const stored = memoryStore.get(key);
        if (stored) {
          return NextResponse.json({
            success: true,
            data: stored.data,
            lastUpdated: stored.lastUpdated,
          });
        }
        return NextResponse.json({
          success: false,
          message: 'كود غير صحيح',
        });
      }
    }

    // Update room
    if (action === 'update') {
      if (isConfigured()) {
        // Check if room exists
        const existing = await redisGet(key);
        if (existing) {
          // Only update if newer
          const success = await redisSet(key, data || '', now);
          if (success) {
            return NextResponse.json({
              success: true,
              lastUpdated: now,
            });
          }
        }
        // Room doesn't exist or update failed - try to create
        const success = await redisSet(key, data || '', now);
        if (success) {
          return NextResponse.json({
            success: true,
            lastUpdated: now,
          });
        }
        return NextResponse.json({
          success: false,
          message: 'فشل التحديث',
        });
      } else {
        memoryStore.set(key, { data: data || '', lastUpdated: now });
        return NextResponse.json({
          success: true,
          lastUpdated: now,
        });
      }
    }

    return NextResponse.json({ success: false, message: 'إجراء غير صحيح' });
  } catch (e) {
    console.error('Sync error:', e);
    return NextResponse.json({ success: false, message: 'خطأ' }, { status: 400 });
  }
}
