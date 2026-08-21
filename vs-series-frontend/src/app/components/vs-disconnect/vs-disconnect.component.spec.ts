import {ComponentFixture, TestBed} from '@angular/core/testing';
import {VsDisconnectComponent} from "./vs-disconnect.component";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {Observable, of} from "rxjs";

describe('VsDisconnectComponent', () => {
  let fixture: ComponentFixture<VsDisconnectComponent>;
  let component: VsDisconnectComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VsDisconnectComponent],
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

    fixture = TestBed.createComponent(VsDisconnectComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
