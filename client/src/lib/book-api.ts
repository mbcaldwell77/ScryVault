export interface BookData {
  title: string;
  author: string;
  publisher?: string;
  year?: string;
  imageUrl?: string;
}

export async function lookupBookByISBN(isbn: string): Promise<BookData | null> {
  try {
    // Try OpenLibrary API first
    const openLibraryData = await fetchFromOpenLibrary(isbn);
    if (openLibraryData) {
      return openLibraryData;
    }

    // Fallback to Google Books API
    const googleBooksData = await fetchFromGoogleBooks(isbn);
    if (googleBooksData) {
      return googleBooksData;
    }

    return null;
  } catch (error) {
    console.error("Book lookup error:", error);
    return null;
  }
}

async function fetchFromOpenLibrary(isbn: string): Promise<BookData | null> {
  try {
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    
    if (!response.ok) {
      throw new Error(`OpenLibrary API error: ${response.status}`);
    }

    const data = await response.json();
    const bookKey = `ISBN:${isbn}`;
    const book = data[bookKey];

    if (!book) {
      return null;
    }

    return {
      title: book.title || "Unknown Title",
      author: book.authors?.[0]?.name || "Unknown Author",
      publisher: book.publishers?.[0]?.name || "Unknown Publisher",
      year: book.publish_date || "Unknown",
      imageUrl: book.cover?.large || book.cover?.medium || book.cover?.small || "",
    };
  } catch (error) {
    console.error("OpenLibrary API error:", error);
    return null;
  }
}

async function fetchFromGoogleBooks(isbn: string): Promise<BookData | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    );

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const book = data.items[0].volumeInfo;

    return {
      title: book.title || "Unknown Title",
      author: book.authors?.[0] || "Unknown Author",
      publisher: book.publisher || "Unknown Publisher",
      year: book.publishedDate?.split("-")[0] || "Unknown",
      imageUrl: book.imageLinks?.thumbnail?.replace("http:", "https:") || "",
    };
  } catch (error) {
    console.error("Google Books API error:", error);
    return null;
  }
}

export function validateISBN(isbn: string): boolean {
  // Remove any hyphens or spaces
  const cleaned = isbn.replace(/[-\s]/g, "");
  
  // Check if it's 10 or 13 digits
  return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned);
}

// Convert ISBN-10 to ISBN-13
export function convertISBN10to13(isbn10: string): string {
  const cleanISBN = isbn10.replace(/[-\s]/g, '');
  if (cleanISBN.length !== 10) return isbn10;
  
  const prefix = '978' + cleanISBN.substr(0, 9);
  let checksum = 0;
  
  for (let i = 0; i < 12; i++) {
    checksum += parseInt(prefix[i]) * (i % 2 === 0 ? 1 : 3);
  }
  
  const checkDigit = (10 - (checksum % 10)) % 10;
  return prefix + checkDigit;
}

// Convert ISBN-13 to ISBN-10 (if possible)
export function convertISBN13to10(isbn13: string): string | null {
  const cleanISBN = isbn13.replace(/[-\s]/g, '');
  if (cleanISBN.length !== 13 || !cleanISBN.startsWith('978')) return null;
  
  const base = cleanISBN.substr(3, 9);
  let checksum = 0;
  
  for (let i = 0; i < 9; i++) {
    checksum += parseInt(base[i]) * (10 - i);
  }
  
  const checkDigit = (11 - (checksum % 11)) % 11;
  const checkChar = checkDigit === 10 ? 'X' : checkDigit.toString();
  
  return base + checkChar;
}

// Normalize ISBN to always use ISBN-13 format for consistency
export function normalizeISBN(isbn: string): string {
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  
  if (cleanISBN.length === 10) {
    return convertISBN10to13(cleanISBN);
  } else if (cleanISBN.length === 13) {
    return cleanISBN;
  }
  
  return isbn; // Return original if invalid
}
