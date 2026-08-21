import {ComponentFixture, TestBed} from '@angular/core/testing';
import {VsConnectComponent} from "./vs-connect.component";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {Observable, of} from "rxjs";

describe('VsConnectComponent', () => {
  let fixture: ComponentFixture<VsConnectComponent>;
  let component: VsConnectComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VsConnectComponent],
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader, useValue: {
            getTranslation(): Observable<Record<string, string>> {
              return of({});
            }
          }
        }
      })],
    }).compileComponents();

    fixture = TestBed.createComponent(VsConnectComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
