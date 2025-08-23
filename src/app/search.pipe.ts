import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search'
})
export class SearchPipe implements PipeTransform {

  transform(books: any[], searchQuery: string): any[] {
    // Handle edge cases
    if (!books || !Array.isArray(books)) {
      return [];
    }
    
    if (!searchQuery || searchQuery.trim() === '') {
      return books;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return books.filter(book => {
      if (!book) return false;
      
      const title = book.title || '';
      const author = book.author || '';
      
      return title.toLowerCase().includes(query) || author.toLowerCase().includes(query);
    });
  }
}


