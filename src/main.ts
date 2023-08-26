import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from 'app/app.component';
import { appConfig } from 'app/app.config';
import { default as localForage, getAllDataFromLocalForage } from 'ngrx-store-persist';

getAllDataFromLocalForage({
    driver: localForage.INDEXEDDB,
    keys: ['recipes'],
}).then(() => {
    bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
});
