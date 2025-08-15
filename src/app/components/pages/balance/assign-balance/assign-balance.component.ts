import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { forkJoin } from 'rxjs';
import { BalanceService } from 'src/app/services/balance.service';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { onMessage, getMessaging } from 'firebase/messaging';
import { NgZone } from '@angular/core';
// firebase-config.ts
import { initializeApp } from 'firebase/app';

export const firebaseApp = initializeApp({
            apiKey: "AIzaSyBvBdLYy7MP1nLRZL1CymVqxYmqsh8PAlw",
            authDomain: "app-agente-cash.firebaseapp.com",
            projectId: "app-agente-cash",
            storageBucket: "app-agente-cash.firebasestorage.app",
            messagingSenderId: "611392897382",
            appId: "1:611392897382:web:97535506688d57e494c8a7"
        });

@Component({
  selector: 'app-assign-balance',
  templateUrl: './assign-balance.component.html',
  styleUrls: ['./assign-balance.component.scss']
})
export class AssignBalanceComponent implements OnInit {

  public assignForm!: FormGroup;
  public selectedType: any;
  public typeEntity: any;
  public nameType: any[] = [];
  public nameConcept: string | undefined;
  public provider: string = 'PROVIDER'
  public selectedTabIndex = 0;
  public verificationCode: string = '';
  public verificationForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private assignService: BalanceService,
    private masterService: MasterService,
    private personService: PersonService,
    private spinner: SpinnerService,
    private router: Router,
    private mytoastr: MytoastrService,
    private cookieService: CookieService,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    const messaging = getMessaging();
    this.formAssign();
    this.listData();
    this.nameConcept = this.concept?.value;
    this.concept?.valueChanges.subscribe(value => {
      if (value) {
        this.concept?.setValue(value.toUpperCase(), { emitEvent: false });
      }
    });

    onMessage(messaging, (payload) => {
  console.log('📩 Notificación recibida:', payload);

  const data = payload.data as { code?: string };

  if (data.code) {
    this.ngZone.run(() => {
      this.verificationForm.get('code')?.setValue(data.code);
    });
  }

  // Mostrar notificación visual si el navegador lo permite
  if (Notification.permission === 'granted') {
    new Notification('Código de verificación', {
      body: `Tu código es: ${data.code}`,
    });
  }
});

  }

  formAssign() {
    this.assignForm = this.fb.group({
      concept: [{ value: 'SALDO', disabled: true }, Validators.required],
      billHolder: "API",
      idProvider: [],
      idClient: [],
      amountTransaction: ['', Validators.required],
      currency: [{ value: 'PEN', disabled: true }]
    })
    this.verificationForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6)]]
    });

  }



  listData() {
    forkJoin([
      this.masterService.getItemsMasterTable('11')

    ]).subscribe({
      next: ([typeEntity]) => {
        this.typeEntity = typeEntity.sort((a: any, b: any) => a.master_order - b.master_order);
        console.log("ENTIDAD: ", this.typeEntity)
      },
      error: (err: any) => {
        console.error('Error:', err);
      },
    })
  }

  selecType(event: any) {
    console.log("ENTIDAD: ", event.value.master_relativeName)
    this.selectedType = event.value.master_name
    this.searchPerson(event.value.master_relativeName)
  }

  idPerson: string | undefined
  selectEntity(event: any) {
    console.log("ENTIDAD para asignar: ", event.value.idPerson)
    this.idPerson = event.value.idPerson;
    this.concept?.setValue(this.nameConcept)
    let name = this.concept?.value.concat(' ' + event.value.nameAlias)
    this.concept?.setValue(name)
    if (this.selectedType == this.provider) {
      this.idProvider?.setValue(event.value.idPerson)
      this.idClient?.setValue(null)
    } else {
      this.idClient?.setValue(event.value.idPerson)
      this.idProvider?.setValue(null)
    }
  }

  searchPerson(nameType: string) {

    this.spinner.spinnerOnOff();
    this.personService.getPerson(nameType, undefined).subscribe({
      next: (value) => {
        this.nameType = value.data
        console.log('TYPE ENTITU POR ENTIDAD: ', this.nameType)
      },
      error: (error) => {
        console.log(error)
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      }

    })
  }

  onPrevious() {
    this.router.navigate(['/balance/control'])
  }

  goToVerification() {
    if (this.assignForm.valid) {
      const userId = this.cookieService.get('userId');
      const fcmToken = localStorage.getItem('fcmToken');

      this.assignService.generateCode(userId, fcmToken || '').subscribe({
        next: (res) => {
          console.log('✅ Código enviado por notificación push');
          this.selectedTabIndex = 1;
        },
        error: (err) => {
          console.error('❌ Error al enviar código:', err);
        }
      });
    }
  }

  verifyCode() {
    const userId = this.cookieService.get('userId');
    const code = this.verificationForm.get('code')?.value;

    this.assignService.verificateCode(code, userId).subscribe({
      next: (res) => {
        if (res.valid) {
          console.log('✅ Código válido, guardando...');
          this.saveAssign();
        } else {
          console.warn('❌ Código inválido');
        }
      },
      error: (err) => {
        console.error('❌ Error al verificar código:', err);
      }
    });
  }

  sendPushVerification() {
    // Lógica para enviar notificación push con código
    // Ejemplo:
    // this.pushService.sendVerificationCode(this.assignForm.value);
  }

  saveAssign() {
    if (!this.assignForm.valid || this.typeEntity.length < 0 || this.idPerson == null) {
      this.mytoastr.showWarning('Completar el formulario', '')
      return
    }
    this.spinner.spinnerOnOff();
    console.log("FORMULARIO DATA: ", this.assignForm.getRawValue())
    const data = this.assignForm.getRawValue();
    // return
    this.assignService.assignBalance(data).subscribe({
      next: (value) => {
        if (value?.statusCode !== 200) {
          this.mytoastr.showError('Error al asignar saldo', value?.messages)
          this.spinner.spinnerOnOff();
          return
        }
        this.mytoastr.showSuccess(value.message, '')
        console.log(value)
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error(error)
      },
      complete: () => {
        this.spinner.spinnerOnOff();
        this.router.navigate(['/balance/control'])
      }

    })
  }

  get concept() {
    return this.assignForm.get('concept');
  }

  get currency() {
    return this.assignForm.get('currency');
  }

  get idProvider() {
    return this.assignForm.get('idProvider');
  }

  get idClient() {
    return this.assignForm.get('idClient');
  }


}
