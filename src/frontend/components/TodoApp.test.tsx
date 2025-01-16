import { shortenUrl } from '../utils/urlUtils';
import '@testing-library/jest-dom';

describe('shortenUrl', () => {
  it('should return the original URL if it is shorter than maxLength', () => {
    const url = 'example.com';
    expect(shortenUrl(url)).toBe(url);
  });

  it('should remove protocol from the URL', () => {
    const url = 'https://example.com';
    expect(shortenUrl(url)).toBe('example.com');
  });

  it('should truncate long URLs with ellipsis in the middle', () => {
    const url = 'https://very-long-subdomain.example.com/path/to/very/long/resource';
    const shortened = shortenUrl(url, 30);
    
    // Should be around 30 characters
    expect(shortened.length).toBeLessThanOrEqual(30);
    
    // Should contain parts from start and end
    expect(shortened).toContain('very-long-subd');  // Start of URL
    expect(shortened).toContain('resource');        // End of URL
    
    // Should have ellipsis in the middle
    expect(shortened).toContain('...');
    
    // Should maintain the specified length (with some tolerance for rounding)
    expect(Math.abs(shortened.length - 30)).toBeLessThanOrEqual(1);
  });

  it('should handle URLs with query parameters', () => {
    const url = 'https://example.com/search?q=test&page=1';
    const shortened = shortenUrl(url, 25);
    
    // Should be around 25 characters
    expect(shortened.length).toBeLessThanOrEqual(25);
    
    // Should contain parts from start and end
    expect(shortened).toContain('example');
    expect(shortened).toContain('page=1');
    
    // Should have ellipsis in the middle
    expect(shortened).toContain('...');
  });
});