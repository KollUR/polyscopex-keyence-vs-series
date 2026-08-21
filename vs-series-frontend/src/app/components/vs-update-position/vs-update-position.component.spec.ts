import {ComponentFixture, TestBed} from '@angular/core/testing';
import {VsUpdatePositionComponent} from "./vs-update-position.component";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {Observable, of} from "rxjs";

describe('VsUpdatePositionComponent', () => {
  let fixture: ComponentFixture<VsUpdatePositionComponent>;
  let component: VsUpdatePositionComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VsUpdatePositionComponent],
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

    fixture = TestBed.createComponent(VsUpdatePositionComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
