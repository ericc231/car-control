import { Component } from '@angular/core';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  configData = { carip: ''};
  carip: string;
  constructor(private storage: StorageService) {}
  setStorage() {
    this.storage.setString('carip', this.carip);
    this.storage.setObject('configData', {
      carip: this.carip
    });
  }

  getStorage() {
    this.storage.getString('carip').then((data: any) => {
      if (data.value) {
        this.carip = data.value;
      }else{
        this.carip = '';
      }
    });
    this.storage.getObject('configData').then((data: any) => {
      this.configData = data;
    });
  }

  clearStorage() {
    this.storage.clear();
    this.getStorage();
  }
  ngAfterViewInit() {
    this.getStorage();
  }
}
