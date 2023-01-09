import { Component, ElementRef, ViewChild } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { interval } from 'rxjs';
import { LoadingController, ModalController, Platform, ToastController } from '@ionic/angular';
import { Chart,registerables} from 'chart.js';
import { HistoryPage } from '../history/history.page';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  dateTime: any;
  @ViewChild('barCanvas') barCanvas: ElementRef ;
  @ViewChild('pieCanvas') pieCanvas: ElementRef;
  // @ViewChild('lineCanvas') private lineCanvas: ElementRef;
//
  barChart: any;
  pieChart: any;
  ModuleList: any;
  inputparams = {
    moduleid: 13,
  };

  machineSNList: any;
  SewingTimes: any;
  HandlingTime: any;
  IdleTimes: any;
  machineOffTimes: any;
  elaspsedHours:number=0;


  constructor(private socket: Socket, public toast:ToastController,public platform:Platform,public loader:LoadingController,public modal:ModalController) {
    Chart.register(...registerables);
  }



  ionViewDidLoad(){
   console.log("Ion View Did Load");
  }

  ngAfterViewInit(){
    console.log("After NG View INIT");
    
    this.pieCharts();
    this.barChartMethod();
    this.localTime();
    this. UpdateGraphs() ;
  }


  insertTable($event: any) {
    console.log('Slected Value', this.inputparams.moduleid);
    this.socket.emit('GetMcList', { lineID: this.inputparams.moduleid }); // Request Data From DB
    
  }

  localTime() {
    interval(1000).subscribe((x) => {
      this.dateTime = new Date().toISOString();
   
      
      // this.barChart.data.labels.pop();

    });
  }

  UpdateGraphs() {
    interval(5000).subscribe((x) => {
 
      console.log("Barchart Dtat:-",this.barChart.data.datasets);
      console.log("Barchart Dtat Lables+++:-",this.barChart.data.labels);
      this.socket.emit('GetMcList', { lineID: this.inputparams.moduleid });

    });
  }

  async presentToast(Text: string) {
    const toast = await this.toast.create({
      message: Text,
      duration: 2000,
      position: 'top',
    });

    await toast.present();
  }

  ngOnInit() {
  
    this.TimeElapsed();
    if (this.platform.is('android')) {
      this.presentToast('PlatForm Detected:- IS ANdroid');
      console.log('Android!');
      // this.CreatDB(); // Create DB IF Not Created
   
    } else {
      this.presentToast(
        'Android Not Detected Switching To:- IS BROWSER'
      );
      console.log(
        'Android Not Detected Switching To:-WEB'
        
      );
    }

    console.log('Start Socket Connect..');
    this.socket.connect();

    this.socket.fromEvent('modulelist').subscribe((data) => {
      this.ModuleList = [];
      console.log('Module List Requested', data);
      var received_data = data;
      var stringed_data = JSON.stringify(data);
      var JSONData = JSON.parse(stringed_data);

      for (var i = 0; i < JSONData.length; i++) {
        console.log(JSONData[i]);
        var test = JSONData[i];
        this.ModuleList.push(JSONData[i]);
      }

      console.log('JSONED DATA', this.ModuleList);
    });

    this.socket.fromEvent('GetMcList').subscribe(async (data) => {
      console.log("MAchine Data Listner Active---------------------------------------------------------");
      const load=await this.loader.create({
        message: 'Obtaining data',
      });
      load.present();

      this.machineSNList = [];
      this.SewingTimes = [];
      this.HandlingTime = [];
      this.IdleTimes = [];
      this.machineOffTimes = [];
      console.log('Machine LIST Data Received', data);
      var Stringdata = JSON.stringify(data);
      var parsedata = JSON.parse(Stringdata);

      var totalRuntimeAllmc=0;
      var totalIdletimeAllmc=0;
      var totalHandlingtimeAllmc=0;
      var totalMachineOFFTimeAllmc=0;
      var TotalAllMachines=0;
      for (var i = 0; i < parsedata.length; i++) {
        console.log('Data SN:--', parsedata[i].SerialNo);
        var sn = parsedata[i].SerialNo;
        if (sn) {
          console.log('IS Not Null ');

          this.machineSNList.push(sn);
          this.SewingTimes.push(
            parsedata[i].RunTime_ms / (1000 * 60 * 60)
          );
          this.HandlingTime.push(
            parsedata[i].StopTime_ms / (1000 * 60 * 60)
          );
          this.IdleTimes.push(
            parsedata[i].DeltaTimePrevSeamEnd2Start_ms / (1000 * 60 * 60)
          );

          var totalActivity=(parsedata[i].RunTime_ms / (1000 * 60 * 60))+(parsedata[i].StopTime_ms / (1000 * 60 * 60))+( parsedata[i].DeltaTimePrevSeamEnd2Start_ms / (1000 * 60 * 60))
          var totalMacOffTimes=this.elaspsedHours-totalActivity;
          this.machineOffTimes.push(
           totalMacOffTimes
          );

           totalRuntimeAllmc=totalRuntimeAllmc+ (parsedata[i].RunTime_ms / (1000 * 60 * 60));
           totalIdletimeAllmc=totalIdletimeAllmc+(parsedata[i].DeltaTimePrevSeamEnd2Start_ms / (1000 * 60 * 60));
           totalHandlingtimeAllmc=totalHandlingtimeAllmc+( parsedata[i].StopTime_ms / (1000 * 60 * 60));
           totalMachineOFFTimeAllmc=totalMachineOFFTimeAllmc+(totalMacOffTimes);

           

        } else {
          console.log('IS Null');

          // this.machineSNList.push(0);
        }
        // console.log('Total Sewing Time:--', parsedata[i][0].TotalSewingTime_ms);
        // console.log('Total Handling Time:--', parsedata[i][0].DeltaTimePrevSeamEnd2Start_ms);
      }
console.log(totalRuntimeAllmc);
console.log(totalIdletimeAllmc);
console.log(totalHandlingtimeAllmc);
console.log(totalMachineOFFTimeAllmc);
TotalAllMachines=totalRuntimeAllmc+totalIdletimeAllmc+totalHandlingtimeAllmc+totalMachineOFFTimeAllmc;

console.log("PIE CHART DATA STRUCTURE",this.pieChart.data.datasets);
this.pieChart.data.datasets[0].data=[(totalRuntimeAllmc/TotalAllMachines)*100,(totalIdletimeAllmc/TotalAllMachines)*100,(totalHandlingtimeAllmc/TotalAllMachines)*100,(totalMachineOFFTimeAllmc/TotalAllMachines)*100];
this.pieChart.update('none');


this.barChart.data.datasets.forEach((dataset:any) => {
  dataset.data.pop();

});



this.barChart.data.labels.forEach((label:any) => {
  this.barChart.data.labels.pop();
 
});

console.log("MACHINE LIST RECORDED----------------------",this.machineSNList);
this.barChart.data.labels = this.machineSNList;
this.barChart.data.datasets[0].data=this.SewingTimes;
this.barChart.data.datasets[1].data=this.HandlingTime;
this.barChart.data.datasets[2].data=this.IdleTimes;
this.barChart.data.datasets[3].data=this.machineOffTimes;



this.barChart.update('none');
load.dismiss();
  
    });

    // this.socket.emit('GetMcList', { lineID: this.inputparams.moduleid });
  }

  
  TimeElapsed(){
    console.log("Time Elaspsed from 7.30 AM");
    interval(1000).subscribe((x) => {
      
      var today=new Date().toISOString().slice(0, 10);
      console.log(today);
       var concatdate=""+today+" 07:30:00";//String(today)+"07:30:00";
      var TodayStart=new Date(concatdate);
      var now =new Date();
      console.log(TodayStart);
      var diff = Math.abs(now.getTime() - TodayStart.getTime()) / 3600000;
      console.log("Difference Time:--",diff);
      if(diff>9){
        this.elaspsedHours=9;
      }else{
        this.elaspsedHours=diff;
      }
     
    });
  }

  barChartMethod() {
    // Now we need to supply a Chart element reference with an object that defines the type of chart we want to use, and the type of data we want to display.
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['data1','data2','data3','data4'],
        datasets: [
          {
            label: 'Sewing Time',
            data: [20,34,5,67],
            backgroundColor: 'rgba(0, 229, 81, 1)',
            stack: 'Stack 0',
          },
          {
            label: 'Handling Time',
            data: [23,56,78,9],
            backgroundColor: 'rgba(255, 255, 17, 1)',
            stack: 'Stack 0',
          },
          {
            label: 'Idle Time',
            data: [12,34,56,78],
            backgroundColor: 'rgba(255, 159, 64, 1)',
            stack: 'Stack 0',
          },
          {
            label: 'Machine OFF Time',
            data:[23,45,67,56],
            backgroundColor: 'rgba(255, 0, 136, 1)',
            stack: 'Stack 0',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {},
        onClick:async function(err,activeEls,tes){
          console.log(err);console.log(activeEls);console.log(tes);

      }
      },
    });
    this.barChart.canvas.parentNode.style.height = '328px';

    this.barChart.canvas.parentNode.style.width = '428px';
    
  }

  getCurrentMCList() {}
  pieCharts() {
    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: ['Sewing Time%', 'Idle Time%', 'Handling Time%','Machine OFF Time%'],
        datasets: [
          {
            //label:['Sewing Time', 'Handling Time', 'Idle Time','Machine OFF Time'],
            data: [20, 20, 50,10],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {},
        onClick:async function(err,activeEls){
            console.log(err);console.log(activeEls);
         
        }
      },
    });

    this.pieChart.canvas.parentNode.style.height = '328px';

    this.pieChart.canvas.parentNode.style.width = '428px';
 
  }

  async openModal(machineID:string){
    console.log("Received Machine History ID For ",machineID);
    const modal = await this.modal.create({
        // component: NotificationPage,
        component: HistoryPage,
        cssClass: 'ModalCss',
        componentProps: { 
          MachineSN: machineID
          
        }
        // breakpoints: [0, 0.3, 0.5, 0.8],
        // initialBreakpoint: 0.5
    });
    modal.present();
  }
}
