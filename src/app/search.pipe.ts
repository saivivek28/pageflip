import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search'
})
export class SearchPipe implements PipeTransform {

  transform(books: any[], searchQuery: string): any[] {
    if (!searchQuery){
      return books;}
    else{
      return books.filter(book => book.title.toLowerCase().includes(searchQuery.toLocaleLowerCase()))
    }
    };


  }


