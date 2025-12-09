import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [RouterModule],
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  constructor(private authService: AuthService) {}

  loginWithGoogle() {
    //  Redirige al backend para iniciar OAuth2 con Google
    window.location.href = `${environment.API_BASE_URL}/oauth2/authorization/google`;
  }

  //  modo invitado
  continuarComoInvitado() {
    this.authService.activarModoInvitado();
  }
}

