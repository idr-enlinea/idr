import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioModel } from 'src/app/models/usuario.model';
import { Router } from '@angular/router';
import { LoginModel } from 'src/app/models/login.model';
import { ToastrService } from 'ngx-toastr';
declare const Swal

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  registroForm: FormGroup;
  loginForm: FormGroup;
  usuarioModel: UsuarioModel
  loginModel: LoginModel

  mostrarContrasena: boolean = false;

  esRestringido: boolean = false;

  arrayTelefonos: any = []
  arrayDominios: any = []
  arrayEmpresas: any = []
  cargandoFiltros: boolean = true;
  private _id: string;
  politicasBoolean: boolean = true;

  emailExiste: boolean = false;

  constructor(private auth: AuthService, private fb: FormBuilder, private router: Router, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.inicializarRegistro();
    this.inicializarLogin();
    // this.peticionFiltros()

  }

  peticionFiltros() {
    return new Promise((resolve: any, reject: any) => {
      this.auth.obtenerDatosFiltro().subscribe(resp => {
        this.arrayTelefonos = resp[0].telefonos
        this.arrayDominios = resp[0].dominios
        this.arrayEmpresas = resp[0].empresas
        this.cargandoFiltros = false
        resolve(true)
      }, error => {
        console.log(error);
        reject(false)
      })
    })
  }

  inicializarRegistro() {

    this.registroForm = this.fb.group({
      nombre: [, [Validators.required]],
      apellido: [, [Validators.required]],
      empresa: [, [Validators.required]],
      telefono: [, [Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^[0-9]\d*$/)]],
      telefono2: [, [Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^[0-9]\d*$/)]],
      email: [, [Validators.required, Validators.pattern(/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)]],
      lada: ['+52',],
      lada2: [,],
      politicas: [,]
    })
  }

  inicializarLogin() {

    this.loginForm = this.fb.group({
      email: [, [Validators.required, Validators.pattern(/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)]],
      password: [, [Validators.required]]
    })
  }

  getErroresLogin(campo: string) {
    return this.loginForm.controls[campo].errors && this.loginForm.controls[campo].touched;
  }

  getErroresRegistro(campo: string) {
    return this.registroForm.controls[campo].errors && this.registroForm.controls[campo].touched;
  }

  cambioCheck(event: any) {
    if (event.target.checked) {
      this.politicasBoolean = true;
    } else {
      this.politicasBoolean = false;
    }
  }

  async guardarRegistro() {

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();

      if (!this.registroForm.value.politicas) {
        this.politicasBoolean = false;
      }

      return;
    }

    if (!this.registroForm.value.politicas) {
      this.politicasBoolean = false;
      return;
    }

    this.politicasBoolean = true;

    let obtenerFiltros = await this.peticionFiltros()

    if (!obtenerFiltros) {
      Swal.fire({
        title: 'Ocurrio un error',
        text: 'Vuelva a recargar la p??gina',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      })
      return;
    }

    let telefonoFind = await this.arrayTelefonos.find(element => element == this.registroForm.value['telefono'])
    let empresaFind = await this.arrayEmpresas.find(element => element.toLowerCase() == this.registroForm.value['empresa'].toLowerCase())
    let emailFind = await this.arrayDominios.find(element => this.registroForm.value['email'].includes(element.toLowerCase()))

    if (telefonoFind || empresaFind || emailFind) {
      Swal.fire({
        allowOutsideClick: false,
        icon: 'info',
        text: 'Guardando informaci??n'
      });
      Swal.showLoading();

      let lada = this.registroForm.get('lada').value
      let lada2 = this.registroForm.get('lada2').value
      delete this.registroForm.value['lada']
      delete this.registroForm.value['lada2']
      delete this.registroForm.value['politicas']
      this.usuarioModel = this.registroForm.value
      let telefono = lada + this.registroForm.value['telefono']
      let telefono2 = lada2 + this.registroForm.value['telefono2']
      this.usuarioModel.telefono = telefono
      this.usuarioModel.telefono2 = telefono2

      this.auth.enviarEmailIngresoRestringido(this.usuarioModel).subscribe(resp => {

      }, error => {
        console.log(error);
        this.auth.enviarEmailIngresoRestringido2(this.usuarioModel).subscribe(resp => {

        }, error => {
          console.log(error);
        })
      })

      setInterval(() => {
        this.esRestringido = true
        Swal.close()
      }, 4000)

      return

    }

    const password = await this.generatePasswordRand();
    // console.log(password);

    Swal.fire({
      title: '??Sus datos son correctos?',
      text: 'Se enviar?? un email a su correo electr??nico con los accesos para ingresar a IDR demo en l??nea',
      icon: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Aceptar'
    }).then(resp => {
      if (resp.value) {

        Swal.fire({
          allowOutsideClick: false,
          icon: 'info',
          text: 'Guardando informaci??n'
        });
        Swal.showLoading();

        let lada = this.registroForm.get('lada').value
        let lada2 = this.registroForm.get('lada2').value
        delete this.registroForm.value['lada']
        delete this.registroForm.value['lada2']
        delete this.registroForm.value['politicas']
        this.usuarioModel = this.registroForm.value
        let telefono = lada + this.registroForm.get('telefono').value
        let telefono2 = lada2 + this.registroForm.get('telefono2').value
        this.usuarioModel.telefono = telefono
        this.usuarioModel.telefono2 = telefono2
        this.usuarioModel.password = password

        this.auth.registro(this.usuarioModel).subscribe(next => {

          this.auth.enviarEmailIngreso(this.usuarioModel).subscribe(resp => {
            // console.log(resp);
            this.auth.enviarEmailAccesos(this.usuarioModel).subscribe(resp => {
              // console.log(resp);
              Swal.fire({
                title: 'Registrado correctamente',
                text: `??Bienvenido ${this.usuarioModel.nombre}!, ingresa las credenciales que se te enviaron via correo, revisa tu bandeja de entrada, promociones o spam`,
                icon: 'success'
              })
            }, error => {
              console.log(error);
              Swal.close()
            })
          }, error => {
            // console.log(error);
            this.auth.enviarEmailIngreso2(this.usuarioModel).subscribe(resp => {

              this.auth.enviarEmailAccesos2(this.usuarioModel).subscribe(resp => {
                // console.log(resp);
                Swal.fire({
                  title: 'Registrado correctamente',
                  text: `??Bienvenido ${this.usuarioModel.nombre}!, ingresa las credenciales que se te enviaron via correo, revisa tu bandeja de entrada, promociones o spam`,
                  icon: 'success'
                })
              }, error => {
                console.log(error);
                Swal.close()
              })
            })
          })

        }, error => {
          Swal.close()
          console.log(error);
          if (error.error.includes('Email ya existe')) {
            Swal.fire({
              title: 'El email de registro ya existe',
              text: 'Este email ya ha sido registrado',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            })
            this.emailExiste = true;
          }
        }, () => {
          this.registroForm.reset({
            lada: '+52'
          })
        })
      }
    })
  }

  async nuevaContrasena() {
    if (!this.loginForm.get('email').value) {
      this.toastr.warning(`Debe escribir su usuario para restaurar su contrase??a`, `Campo "Usuario" vac??o`, {
        timeOut: 5000,
      });
      return;
    }

    if (this.loginForm.controls['email'].errors) {
      this.toastr.warning(`Debe escribir correctamente su usuario`, `Advertencia`, {
        timeOut: 5000,
      });
      return;
    }

    let password = await this.generatePasswordRand()
    Swal.fire({
      title: '??Desea restaurar su contrase??a?',
      text: 'Se enviar?? un email a su correo electr??nico con los nuevos accesos para ingresar a IDR demo en l??nea',
      icon: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Aceptar'
    }).then(resp => {

      if (resp.value) {
        Swal.fire({
          allowOutsideClick: false,
          icon: 'info',
          text: 'Validando informaci??n'
        });
        Swal.showLoading();

        let email = this.loginForm.get('email').value
        const usuario = {
          password: password,
          email: email
        }

        this.auth.modificarPassword(usuario).subscribe(resp => {
          this.auth.enviarEmailNuevaContrasena(usuario).subscribe(resp => {
            Swal.fire({
              title: 'Contrase??a restaurada correctamente',
              text: `Su nueva contrase??a ha sido enviada a su correo`,
              icon: 'success'
            })
          }, error => {
            this.auth.enviarEmailNuevaContrasena2(usuario).subscribe(resp => {
              Swal.fire({
                title: 'Contrase??a restaurada correctamente',
                text: `Su nueva contrase??a ha sido enviada a su correo`,
                icon: 'success'
              })
            })
          })
        }, error => {
          console.log(error);
          Swal.fire({
            title: 'El usuario no existe',
            text: 'Este usuario no ha sido registrado',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          })
        })
      }
    })
  }

  generatePasswordRand() {
    let characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789()#$%@&*+!??,-_???<>";

    let pass = "";
    return new Promise((resolve, reject) => {
      for (let i = 0; i < 10; i++) {
        pass += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      resolve(pass);
    })

  }

  async iniciarSesion() {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return }

    Swal.fire({
      allowOutsideClick: false,
      icon: 'info',
      text: 'Autenticando credenciales'
    });
    Swal.showLoading();

    this.auth.iniciarSesion(this.loginForm.value).subscribe(next => {
      this._id = next['user']['id'];

      this.auth.obtenerUsuario(this._id, localStorage.getItem('token')).subscribe(resp => {
        localStorage.setItem('usuario-sas', JSON.stringify(resp))

        this.auth.enviarDatosAccesosLogin(resp).subscribe(next => {

        }, error => {
          this.auth.enviarDatosAccesosLogin2(resp).subscribe(next => {

          })
        })
      })

      Swal.close()
    }, error => {
      console.log(error);
      Swal.fire({
        title: `Usuario o contrase??a no v??lidos`,
        text: `Ingrese correctamente sus credenciales`,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      })
    }, () => {
      this.router.navigateByUrl(`/idr`);
    })
  }

}