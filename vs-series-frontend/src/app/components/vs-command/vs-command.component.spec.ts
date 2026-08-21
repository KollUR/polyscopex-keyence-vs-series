import {ComponentFixture, TestBed} from '@angular/core/testing';
import {VsCommandComponent} from "./vs-command.component";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {Observable, of} from "rxjs";

describe('VsCommandComponent', () => {
  let fixture: ComponentFixture<VsCommandComponent>;
  let component: VsCommandComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VsCommandComponent],
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

    fixture = TestBed.createComponent(VsCommandComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
