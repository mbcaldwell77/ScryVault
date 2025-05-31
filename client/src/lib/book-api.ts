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
