import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterModule,FormsModule,CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  constructor(private router: Router) {}

  username: string = "";
  password:string = "";

  login() {
    if (this.username == "username" && this.password == "password") {
      this.router.navigate(['/home']);
    }
    else{
      alert("Given details are wrong.");
    }
  }
  signup(){
    this.router.navigate(['/signup']);
  }
}
