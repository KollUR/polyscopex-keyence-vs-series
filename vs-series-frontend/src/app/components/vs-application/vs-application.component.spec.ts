import {ComponentFixture, TestBed} from '@angular/core/testing';
import { VsApplicationComponent} from "./vs-application.component";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {Observable, of} from "rxjs";

describe('VsApplicationComponent', () => {
  let fixture: ComponentFixture<VsApplicationComponent>;
  let component: VsApplicationComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VsApplicationComponent],
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

    fixture = TestBed.createComponent(VsApplicationComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
