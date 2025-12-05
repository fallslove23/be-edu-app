/**
 * HolidayManager - Centralized holiday management system
 *
 * Replaces hardcoded holiday arrays with DB-driven holiday management.
 * Provides caching, validation, and flexible querying.
 */

import { supabase } from '@/lib/supabase';

export interface Holiday {
  id: string;
  date: string; // ISO format: YYYY-MM-DD
  name: string;
  type: 'public' | 'company' | 'custom';
  country: string;
  year: number;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface HolidayQuery {
  year?: number;
  country?: string;
  type?: 'public' | 'company' | 'custom';
  startDate?: string;
  endDate?: string;
}

class HolidayManagerClass {
  private cache: Map<string, Holiday[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

  /**
   * Get cache key for query
   */
  private getCacheKey(query: HolidayQuery): string {
    return JSON.stringify(query);
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) return false;
    return Date.now() < expiry;
  }

  /**
   * Load holidays from database with caching
   */
  async loadHolidays(query: HolidayQuery = {}): Promise<Holiday[]> {
    const cacheKey = this.getCacheKey(query);

    // Return cached data if valid
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      let dbQuery = supabase
        .from('holidays')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: true });

      // Apply filters
      if (query.year) {
        dbQuery = dbQuery.eq('year', query.year);
      }

      if (query.country) {
        dbQuery = dbQuery.eq('country', query.country);
      }

      if (query.type) {
        dbQuery = dbQuery.eq('type', query.type);
      }

      if (query.startDate) {
        dbQuery = dbQuery.gte('date', query.startDate);
      }

      if (query.endDate) {
        dbQuery = dbQuery.lte('date', query.endDate);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Failed to load holidays:', error);
        return [];
      }

      const holidays = (data || []) as Holiday[];

      // Update cache
      this.cache.set(cacheKey, holidays);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      return holidays;
    } catch (error) {
      console.error('Error loading holidays:', error);
      return [];
    }
  }

  /**
   * Check if a date is a holiday
   */
  async isHoliday(date: Date | string, country: string = 'KR'): Promise<boolean> {
    const dateStr = typeof date === 'string' ? date : this.formatDate(date);
    const year = new Date(dateStr).getFullYear();

    const holidays = await this.loadHolidays({ year, country });
    return holidays.some(h => h.date === dateStr);
  }

  /**
   * Get holiday information for a specific date
   */
  async getHoliday(date: Date | string, country: string = 'KR'): Promise<Holiday | null> {
    const dateStr = typeof date === 'string' ? date : this.formatDate(date);
    const year = new Date(dateStr).getFullYear();

    const holidays = await this.loadHolidays({ year, country });
    return holidays.find(h => h.date === dateStr) || null;
  }

  /**
   * Get all holidays for a specific year
   */
  async getYearHolidays(year: number, country: string = 'KR'): Promise<Holiday[]> {
    return this.loadHolidays({ year, country });
  }

  /**
   * Get holidays within a date range
   */
  async getHolidaysInRange(
    startDate: Date | string,
    endDate: Date | string,
    country: string = 'KR'
  ): Promise<Holiday[]> {
    const start = typeof startDate === 'string' ? startDate : this.formatDate(startDate);
    const end = typeof endDate === 'string' ? endDate : this.formatDate(endDate);

    return this.loadHolidays({
      startDate: start,
      endDate: end,
      country
    });
  }

  /**
   * Count holidays in a date range
   */
  async countHolidays(
    startDate: Date | string,
    endDate: Date | string,
    country: string = 'KR'
  ): Promise<number> {
    const holidays = await this.getHolidaysInRange(startDate, endDate, country);
    return holidays.length;
  }

  /**
   * Get holiday dates as string array (for backward compatibility)
   */
  async getHolidayDates(year: number, country: string = 'KR'): Promise<string[]> {
    const holidays = await this.getYearHolidays(year, country);
    return holidays.map(h => h.date);
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Add a new holiday (admin only)
   */
  async addHoliday(holiday: Omit<Holiday, 'id' | 'year' | 'created_at' | 'updated_at'>): Promise<Holiday | null> {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .insert([holiday])
        .select()
        .single();

      if (error) {
        console.error('Failed to add holiday:', error);
        return null;
      }

      // Clear cache to reflect new data
      this.clearCache();

      return data as Holiday;
    } catch (error) {
      console.error('Error adding holiday:', error);
      return null;
    }
  }

  /**
   * Update a holiday (admin only)
   */
  async updateHoliday(id: string, updates: Partial<Holiday>): Promise<Holiday | null> {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update holiday:', error);
        return null;
      }

      // Clear cache to reflect updated data
      this.clearCache();

      return data as Holiday;
    } catch (error) {
      console.error('Error updating holiday:', error);
      return null;
    }
  }

  /**
   * Delete a holiday (admin only)
   */
  async deleteHoliday(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete holiday:', error);
        return false;
      }

      // Clear cache to reflect deletion
      this.clearCache();

      return true;
    } catch (error) {
      console.error('Error deleting holiday:', error);
      return false;
    }
  }
}

// Export singleton instance
export const HolidayManager = new HolidayManagerClass();
