import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'action';
  suggestions?: string[];
  bookRecommendations?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();
  
  private currentMessages: ChatMessage[] = [];
  private conversationContext: any = {};
  private books: any[] = [];

  // FAQ database
  private faqDatabase = {
    'how to buy': 'To buy a book, simply browse our collection, click on a book you like, and hit the "Add to Library" button on the book details page!',
    'how to search': 'You can search for books using the search bar at the top of the page. Try searching by title, author, or genre!',
    'genres available': 'We have many genres including Action, Romance, Sci-Fi, Drama, Fantasy, Horror, Comedy, Self-Help, Philosophy, and Classic books.',
    'account help': 'You can manage your account by clicking on your profile icon in the navbar. From there you can edit your profile or view your library.',
    'library access': 'Access your personal library by clicking the "My Library" button in the navbar. All your purchased books will be there!',
    'book formats': 'We offer both physical books and ebooks. Physical books can be shipped to you, while ebooks can be downloaded immediately.',
    'recommendations': 'I can recommend books based on your preferences! Just tell me what genre you like or describe what you\'re looking for.',
    'pricing': 'Each book has both buy and rent options. Check the book details page for specific pricing information.',
    'support': 'I\'m here to help! You can ask me about books, navigation, account features, or anything else about PageFlip.'
  };

  // Book recommendation templates
  private bookCategories = {
    'beginner': ['Self-Help', 'Philosophy', 'Classic'],
    'adventure': ['Action', 'Sci-Fi', 'Fantasy'],
    'romance': ['Romantic', 'Drama'],
    'funny': ['Comedy'],
    'scary': ['Horror'],
    'serious': ['Drama', 'Philosophy', 'Classic'],
    'learning': ['Self-Help', 'Philosophy']
  };

  constructor() {
    this.initializeChat();
  }

  private initializeChat() {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      text: "👋 Hi! I'm your PageFlip Assistant. I can help you:",
      isUser: false,
      timestamp: new Date(),
      type: 'text',
      suggestions: [
        "Find books by genre",
        "Get book recommendations", 
        "Help with navigation",
        "Account assistance"
      ]
    };
    
    this.currentMessages = [welcomeMessage];
    this.messagesSubject.next(this.currentMessages);
  }

  updateBooksDatabase(books: any[]) {
    this.books = books;
  }

  sendMessage(userInput: string): void {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      text: userInput,
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    };

    this.currentMessages.push(userMessage);
    this.messagesSubject.next(this.currentMessages);

    // Process user input and generate response
    setTimeout(() => {
      const response = this.generateResponse(userInput.toLowerCase().trim());
      this.currentMessages.push(response);
      this.messagesSubject.next(this.currentMessages);
    }, 500); // Simulate thinking time
  }

  private generateResponse(input: string): ChatMessage {
    // Intent detection
    const intent = this.detectIntent(input);
    
    switch (intent.type) {
      case 'book_search':
        return this.handleBookSearch(input, intent.data);
      
      case 'book_recommendation':
        return this.handleBookRecommendation(input, intent.data);
      
      case 'faq':
        return this.handleFAQ(intent.data);
      
      case 'greeting':
        return this.handleGreeting();
      
      case 'genre_filter':
        return this.handleGenreFilter(intent.data);
      
      case 'help':
        return this.handleHelp();
      
      default:
        return this.handleDefault(input);
    }
  }

  private detectIntent(input: string): { type: string; data?: any } {
    // Greeting patterns
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)/.test(input)) {
      return { type: 'greeting' };
    }

    // Help patterns
    if (/help|assistance|support|how to/.test(input)) {
      return { type: 'help' };
    }

    // Book search patterns
    if (/find|search|looking for|show me|book/.test(input)) {
      return { type: 'book_search', data: input };
    }

    // Recommendation patterns
    if (/recommend|suggest|what should|good book|best book/.test(input)) {
      return { type: 'book_recommendation', data: input };
    }

    // Genre filter patterns
    const genres = ['action', 'romantic', 'romance', 'sci-fi', 'drama', 'fantasy', 'horror', 'comedy', 'self-help', 'philosophy', 'classic'];
    const mentionedGenre = genres.find(genre => input.includes(genre));
    if (mentionedGenre) {
      return { type: 'genre_filter', data: mentionedGenre };
    }

    // FAQ patterns
    for (const [key, value] of Object.entries(this.faqDatabase)) {
      if (input.includes(key) || this.fuzzyMatch(input, key)) {
        return { type: 'faq', data: { question: key, answer: value } };
      }
    }

    return { type: 'unknown', data: input };
  }

  private handleBookSearch(input: string, searchTerm: string): ChatMessage {
    const matches = this.books.filter((book: any) =>
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm) ||
      book.genre.toLowerCase().includes(searchTerm)
    );

    if (matches.length > 0) {
      const limitedMatches = matches.slice(0, 3); // Show max 3 results
      const bookList = limitedMatches.map(book => 
        `📖 "${book.title}" by ${book.author} (${book.genre}) - ₹${book.priceBuy}`
      ).join('\n');

      return {
        id: this.generateId(),
        text: `I found ${matches.length} book(s) matching your search:\n\n${bookList}${matches.length > 3 ? '\n\n...and more! Use the search bar above to see all results.' : ''}`,
        isUser: false,
        timestamp: new Date(),
        type: 'text',
        suggestions: ['Show more books', 'Different genre', 'Get recommendations']
      };
    } else {
      return {
        id: this.generateId(),
        text: "I couldn't find any books matching your search. Try searching by:\n• Book title\n• Author name\n• Genre\n\nOr ask me for recommendations!",
        isUser: false,
        timestamp: new Date(),
        type: 'text',
        suggestions: ['Get recommendations', 'Browse genres', 'Popular books']
      };
    }
  }

  private handleBookRecommendation(input: string, data: string): ChatMessage {
    let recommendedBooks: any[] = [];
    let recommendationReason = "";

    // Detect preference from input
    if (input.includes('beginner') || input.includes('start')) {
      recommendedBooks = this.getBooksByCategories(this.bookCategories['beginner']);
      recommendationReason = "Here are some great books for beginners:";
    } else if (input.includes('adventure') || input.includes('action')) {
      recommendedBooks = this.getBooksByCategories(this.bookCategories['adventure']);
      recommendationReason = "Perfect! Here are some thrilling adventure books:";
    } else if (input.includes('romance') || input.includes('love')) {
      recommendedBooks = this.getBooksByCategories(this.bookCategories['romance']);
      recommendationReason = "Here are some beautiful romance books:";
    } else if (input.includes('funny') || input.includes('humor') || input.includes('comedy')) {
      recommendedBooks = this.getBooksByCategories(this.bookCategories['funny']);
      recommendationReason = "Here are some hilarious books to make you laugh:";
    } else if (input.includes('scary') || input.includes('horror')) {
      recommendedBooks = this.getBooksByCategories(this.bookCategories['scary']);
      recommendationReason = "Here are some spine-chilling horror books:";
    } else {
      // Random recommendations
      recommendedBooks = this.getRandomBooks(3);
      recommendationReason = "Here are some popular books I recommend:";
    }

    if (recommendedBooks.length > 0) {
      const bookList = recommendedBooks.map(book => 
        `📚 "${book.title}" by ${book.author}\n   Genre: ${book.genre} | Price: ₹${book.priceBuy}`
      ).join('\n\n');

      return {
        id: this.generateId(),
        text: `${recommendationReason}\n\n${bookList}`,
        isUser: false,
        timestamp: new Date(),
        type: 'text',
        suggestions: ['More recommendations', 'Different genre', 'Browse all books'],
        bookRecommendations: recommendedBooks.slice(0, 3)
      };
    } else {
      return {
        id: this.generateId(),
        text: "I'd love to recommend books, but I need to know more about your preferences! What genre interests you?",
        isUser: false,
        timestamp: new Date(),
        type: 'text',
        suggestions: ['Action', 'Romance', 'Sci-Fi', 'Comedy', 'Self-Help']
      };
    }
  }

  private handleFAQ(data: { question: string; answer: string }): ChatMessage {
    return {
      id: this.generateId(),
      text: data.answer,
      isUser: false,
      timestamp: new Date(),
      type: 'text',
      suggestions: ['More help', 'Book recommendations', 'Browse books']
    };
  }

  private handleGreeting(): ChatMessage {
    const greetings = [
      "Hello! 👋 How can I help you find your next great read?",
      "Hi there! 😊 Looking for a good book today?",
      "Hey! 📚 Ready to discover some amazing books?",
      "Hello! 🌟 What kind of reading adventure are you in the mood for?"
    ];

    return {
      id: this.generateId(),
      text: greetings[Math.floor(Math.random() * greetings.length)],
      isUser: false,
      timestamp: new Date(),
      type: 'text',
      suggestions: ['Book recommendations', 'Browse genres', 'Search books', 'Get help']
    };
  }

  private handleGenreFilter(genre: string): ChatMessage {
    const genreBooks = this.books.filter((book: any) => 
      book.genre.toLowerCase() === genre.toLowerCase()
    );

    if (genreBooks.length > 0) {
      const topBooks = genreBooks.slice(0, 3);
      const bookList = topBooks.map(book => 
        `📖 "${book.title}" by ${book.author} - ₹${book.priceBuy}`
      ).join('\n');

      return {
        id: this.generateId(),
        text: `Great choice! Here are some popular ${genre.charAt(0).toUpperCase() + genre.slice(1)} books:\n\n${bookList}${genreBooks.length > 3 ? `\n\nI found ${genreBooks.length} total books in this genre!` : ''}`,
        isUser: false,
        timestamp: new Date(),
        type: 'text',
        suggestions: ['More in this genre', 'Different genre', 'Get recommendations']
      };
    } else {
      return {
        id: this.generateId(),
        text: `I don't currently have books in the ${genre} genre, but we have many other great options!`,
        isUser: false,
        timestamp: new Date(),
        type: 'text',
        suggestions: ['Browse all genres', 'Get recommendations', 'Popular books']
      };
    }
  }

  private handleHelp(): ChatMessage {
    return {
      id: this.generateId(),
      text: `I'm here to help! Here's what I can do for you:

🔍 **Search for books** - Just tell me the title, author, or genre
📚 **Recommend books** - Based on your preferences
🎯 **Filter by genre** - Find books in specific categories
❓ **Answer questions** - About buying, account, or navigation
🛒 **Shopping help** - Guide you through purchasing

What would you like help with?`,
      isUser: false,
      timestamp: new Date(),
      type: 'text',
      suggestions: ['Find books', 'Get recommendations', 'Account help', 'How to buy']
    };
  }

  private handleDefault(input: string): ChatMessage {
    const responses = [
      "I'm not sure I understood that. Could you try asking about books, recommendations, or how to use PageFlip?",
      "Hmm, I didn't quite get that. Ask me about finding books, getting recommendations, or navigating the site!",
      "I'd love to help! Try asking me about book recommendations, searching for books, or account features.",
      "Not sure about that one! I'm great at helping with books, recommendations, and PageFlip features though!"
    ];

    return {
      id: this.generateId(),
      text: responses[Math.floor(Math.random() * responses.length)],
      isUser: false,
      timestamp: new Date(),
      type: 'text',
      suggestions: ['Book recommendations', 'Search books', 'Help', 'Popular genres']
    };
  }

  private getBooksByCategories(categories: string[]): any[] {
    const books = this.books.filter((book: any) => 
      categories.some(category => 
        book.genre.toLowerCase() === category.toLowerCase()
      )
    );
    return this.shuffleArray(books).slice(0, 3);
  }

  private getRandomBooks(count: number): any[] {
    return this.shuffleArray([...this.books]).slice(0, count);
  }

  private shuffleArray(array: any[]): any[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private fuzzyMatch(input: string, target: string): boolean {
    const words = input.split(' ');
    const targetWords = target.split(' ');
    return targetWords.some(targetWord => 
      words.some(word => word.includes(targetWord) || targetWord.includes(word))
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  clearChat(): void {
    this.currentMessages = [];
    this.conversationContext = {};
    
    // Add a brief "chat cleared" message before initializing
    const clearedMessage: ChatMessage = {
      id: this.generateId(),
      text: "Chat history cleared! 🧹",
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    };
    
    this.currentMessages = [clearedMessage];
    this.messagesSubject.next(this.currentMessages);
    
    // Initialize chat after a brief delay
    setTimeout(() => {
      this.initializeChat();
    }, 1000);
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.currentMessages];
  }
}
