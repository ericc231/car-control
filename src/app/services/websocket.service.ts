import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class WebsocketService {
  ws: WebSocket = null; //定义websocket对象
  commandInProgress = false;
  CMD_TIMEOUT = 50;
  queue = [];
  checkResultTimer;

  constructor() {}
  //创建websockets

  createObservableSocket(url: string): Observable<any> {
    console.log(url);

    this.ws = new WebSocket(url);

    return new Observable((observer) => {
      this.ws.onmessage = (event) => observer.next(event.data);

      this.ws.onerror = (event) => observer.error(event);

      this.ws.onclose = (event) => observer.complete();
    });
  }

  checkAndSend(cleanTimeout) {

    if (cleanTimeout) {
      clearTimeout(this.checkResultTimer);
    }
    this.commandInProgress = true;
    let that = this;
    let cmd = this.queue.shift();
    if (cmd != undefined) {
      this.checkResultTimer = setTimeout(function(){
        that.checkAndSend(false);
      }, this.CMD_TIMEOUT);
      cmd.callback();
    } else {
      this.commandInProgress = false;
    }
  }

  waitForSend(callback) {
    this.queue.push({ callback: callback });
    if (this.commandInProgress) {
      return;
    }
    this.checkAndSend(true);
  }

  send(cmd: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView) {
    let that = this;
    this.waitForSend(function () {
      that.sendMessage(cmd);
    });
  }

  sendMessage(
    msg: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView
  ) {
    let that = this;
    if (this.ws) {
      if (this.ws.readyState === 1) {
        this.ws.send(msg);
      } else {
        console.log("not connect : " + this.ws.readyState);
      }
    } else {
      // socket可能还没连接成功，那么延迟一秒再发送消息
      console.log("connection not open");
      // setTimeout(()=>{
      //   that.ws.send(msg);
      // },1000);
    }
  }
}
