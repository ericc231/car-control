import { Component, OnInit } from "@angular/core";
import {
  create as createManager,
  JoystickManager,
  JoystickOutputData,
} from "nipplejs";
import { StorageService } from "../services/storage.service";
import { Router } from "@angular/router";
import { WebsocketService } from "../services/websocket.service";
import { identifierModuleUrl } from '@angular/compiler';

@Component({
  selector: "app-tab1",
  templateUrl: "tab1.page.html",
  styleUrls: ["tab1.page.scss"],
})
export class Tab1Page {
  iconStyle1 = "display : inline;";
  iconStyle2 = "display : none;";
  carIp: string;
  readyState: Number = 3;
  lastJoystickData: JoystickOutputData;
  lastJoystickDataX: JoystickOutputData;
  //判斷是否要採用搖桿事件的增量限制
  BOI = 5;

  constructor(
    private storage: StorageService,
    private router: Router,
    private wsService: WebsocketService
  ) {}

  ngAfterViewInit() {
    let that = this;
    let myMode = "static" as const;
    let optionsL = {
      zone: document.getElementById("zone_joystickL"),
      mode: myMode,
      position: { left: "25%", top: "75%" },
      color: "red",
    };
    let optionsR = {
      zone: document.getElementById("zone_joystickR"),
      mode: myMode,
      position: { left: "75%", top: "75%" },
      color: "blue",
    };
    let fixJoystickManager = function (manager: JoystickManager,id:number) {
      if (
        manager.get(id) != undefined &&
        manager.get(id).el != undefined &&
        manager.get(id).el.getBoundingClientRect() != undefined
      ) {
        manager.get(id).position.y = manager.get(id).el.getBoundingClientRect().y;
        manager.get(id).position.x = manager.get(id).el.getBoundingClientRect().x;
      }
    };

    const joystickL = createManager(optionsL);
    const joystickR = createManager(optionsR);
    //在ion-content下，joystick的座標會跑掉，導致搖桿不正確
    //在起始的時候修正回來
    joystickL.on("start", function (evt, data) {
      console.log("start");
      fixJoystickManager(joystickL,data.identifier);
    });
    joystickL.on("end", function (evt, data) {
      console.log("end");
      let myDir =
        data.direction != undefined && data.direction.y != undefined
          ? data.direction.y
          : "up";
      //找不到方向就給up，才有辦法判斷東西南北向
      let mylog = { distance: 0,x: 0, y: 0, direction: myDir};
      that.wsService.send(JSON.stringify(mylog));
      console.log(mylog);
    });
    joystickL.on("move", function (evt, data) {
      //左搖桿只管南北向
      let myAngle = data.direction != undefined ? data.direction.angle:"";
      if(myAngle != "up" && myAngle != "down"){
        return;
      }
      //搖桿在中間的時候沒有方向
      let myDir =
        data.direction != undefined && data.direction.y != undefined
          ? data.direction.y
          : "";
      let mylog = {
        distance: data.distance,
        x: data.position.x,
        y: data.position.y,
        direction: myDir,
      };
      //搖桿事件有太多重複，沒變動不用一直給
      if (that.lastJoystickData != null) {
        if (
          that.lastJoystickData.direction != undefined &&
          that.lastJoystickData.direction.y != undefined
        ) {
          //distance有小數位，用整數比
          let floor1 = Math.floor(data.distance);
          let floor2 = Math.floor(that.lastJoystickData.distance);
          //變化超過5才發送
          let incremental = Math.abs(floor1 - floor2);
          if (
            myDir == that.lastJoystickData.direction.y &&
            incremental < that.BOI
          ) {
            console.log("skip move event");
            return;
          }
          mylog.distance = floor1;
        }
      }
      that.lastJoystickData = data;
      that.wsService.send(JSON.stringify(mylog));
      console.log(mylog);
    });
    //換處理左右搖桿
    joystickR.on("start", function (evt, data) {
      console.log("start");
      fixJoystickManager(joystickR,data.identifier);
    });
    joystickR.on("end", function (evt, data) {
      console.log("end");
      let myDir =
        data.direction != undefined && data.direction.x != undefined
          ? data.direction.x
          : "right";
      //找不到方向就給up，才有辦法判斷東西南北向
      let mylog = { distance: 0,x: 0, y: 0, direction: myDir};
      that.wsService.send(JSON.stringify(mylog));
      console.log(mylog);
    });
    joystickR.on("move", function (evt, data) {
      //右搖桿只管東西向
      let myAngle = data.direction != undefined ? data.direction.angle:"";
      if(myAngle != "left" && myAngle != "right"){
        return;
      }
      //搖桿在中間的時候沒有方向
      let myDir =
        data.direction != undefined && data.direction.x != undefined
          ? data.direction.x
          : "";
      let mylog = {
        distance: data.distance,
        x: data.position.x,
        y: data.position.y,
        direction: myDir,
      };
      //搖桿事件有太多重複，沒變動不用一直給
      if (that.lastJoystickDataX != null) {
        if (
          that.lastJoystickDataX.direction != undefined &&
          that.lastJoystickDataX.direction.x != undefined
        ) {
          //distance有小數位，用整數比
          let floor1 = Math.floor(data.distance);
          let floor2 = Math.floor(that.lastJoystickDataX.distance);
          //變化超過5才發送
          let incremental = Math.abs(floor1 - floor2);
          if (
            myDir == that.lastJoystickDataX.direction.x &&
            incremental < that.BOI
          ) {
            console.log("skip move event");
            return;
          }
          mylog.distance = floor1;
        }
      }
      that.lastJoystickDataX = data;
      that.wsService.send(JSON.stringify(mylog));
      console.log(mylog);
    });
}

  ionViewDidEnter() {
    console.log("ionViewDidEnter");
    this.storage.getString("carip").then((data: any) => {
      if (data.value == null) {
        this.router.navigate(["/tabs/config"]);
      } else {
        this.carIp = data.value;
        if (this.readyState == 3) this.doConnect();
      }
    });
  }

  onConnect() {
    this.iconStyle2 = "display : inline;";
    this.iconStyle1 = "display : none;";
  }

  notConnect() {
    this.iconStyle1 = "display : inline;";
    this.iconStyle2 = "display : none;";
  }

  onMessage(data) {
    console.log(data);
  }

  onError(err) {
    console.log(err);
    this.readyState = this.wsService.ws.readyState;
  }
  doConnect() {
    this.readyState = 3;
    this.wsService
      .createObservableSocket("ws://" + this.carIp + "/ws")
      .subscribe(
        (data) => this.onMessage(data),

        (err) => this.onError(err),

        () => console.log("it s over")
      );
    if (this.wsService.ws) {
      let that = this;
      this.wsService.ws.onopen = function () {
        that.readyState = 1;
        that.onConnect();
      };
      this.wsService.ws.onclose = function () {
        that.readyState = 3;
        that.notConnect();
      };
    }
  }
}
