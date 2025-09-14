import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LibraryItemPayload {
  bookId: string;
  isFavorite?: boolean;
  rating?: number;
  dateAdded?: string | Date;
}

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getLibrary(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/user/${userId}/library`);
    }

  addToLibrary(userId: string, payload: LibraryItemPayload): Observable<any> {
    return this.http.post<any>(`${this.api}/user/${userId}/library`, payload);
  }

  updateLibraryItem(userId: string, bookId: string, payload: Partial<LibraryItemPayload>): Observable<any> {
    return this.http.put<any>(`${this.api}/user/${userId}/library/${bookId}`, payload);
  }

  removeFromLibrary(userId: string, bookId: string): Observable<any> {
    return this.http.delete<any>(`${this.api}/user/${userId}/library/${bookId}`);
  }

  getFavorites(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/user/${userId}/favorites`);
  }
}
