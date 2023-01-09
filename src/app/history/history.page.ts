import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { Socket } from 'ngx-socket-io';
@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
})
export class HistoryPage implements OnInit {
  MachineSN: string;
  @ViewChild('barCanvas') barCanvas: ElementRef;
  @ViewChild('pieCanvas') pieCanvas: ElementRef;
  // @ViewChild('lineCanvas') private lineCanvas: ElementRef;

  startDate: any;
  endDate: any;
  barChart: any;
  pieChart: any;
  constructor(public socket: Socket) {
    Chart.register(...registerables);
    var today = new Date().toISOString().split('T')[0];
    this.startDate = today;
    this.endDate = today;
  }

  ngOnInit() {
    console.log('received Machine SN from Back Ground', this.MachineSN);
    this.socket.fromEvent('History').subscribe((data=[]) => {
      console.log('History Data Received From The Socket', data);
      this.barChart.data.datasets.forEach((dataset:any) => {
        dataset.data.pop();
      
      });
      
      
      
      this.barChart.data.labels.forEach((label:any) => {
        this.barChart.data.labels.pop();
       
      });
      var Stringdata = JSON.stringify(data);
      var parsedata = JSON.parse(Stringdata);
      var labellist=[];
      var sewingTime=[];
      var HandlingTime=[];
      var IdleTime=[];
      var machineOffTimes=[];
      for(var i=0;i<parsedata.length;i++){
        var sn=parsedata[i][0].SerialNo;
        if(sn){
        console.log("History",parsedata[i][0]);
        labellist.push(parsedata[i][0].date);
        sewingTime.push(parsedata[i][0].RunTime_ms/(1000*60*60));
        HandlingTime.push(parsedata[i][0].StopTime_ms/(1000*60*60));
        IdleTime.push(parsedata[i][0].DeltaTimePrevSeamEnd2Start_ms/(1000*60*60));
        var offtime=(9-((parsedata[i][0].RunTime_ms)/(1000 * 60 * 60)+(parsedata[i][0].StopTime_ms)/(1000 * 60 * 60)+(parsedata[i][0].DeltaTimePrevSeamEnd2Start_ms)/(1000 * 60 * 60)));
        machineOffTimes.push(offtime);
      }
      }
      this.barChart.data.labels =labellist ;
      this.barChart.data.datasets[0].data =sewingTime;
      this.barChart.data.datasets[1].data = HandlingTime;
      this.barChart.data.datasets[2].data = IdleTime;
      this.barChart.data.datasets[3].data = machineOffTimes;
      this.barChart.update();
    });
  }
  ngAfterViewInit() {
    this.barChartMethod();
    this.pieCharts();
  }

  ChangedDate($event: any) {
    console.log('Changed Event', $event);
    console.log('StartDate', this.startDate);
    console.log('EndDate', this.endDate);

    this.startDate = this.startDate.split('T')[0];
    this.endDate = this.endDate.split('T')[0];
    console.log(
      'Date ONly Start date',
      this.startDate,
      this.endDate,
      this.MachineSN
    );
    this.socket.emit('History', {
      start: this.startDate,
      end: this.endDate,
      sn: this.MachineSN,
    });
  }

  barChartMethod() {
    // Now we need to supply a Chart element reference with an object that defines the type of chart we want to use, and the type of data we want to display.
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['data1', 'data2', 'data3', 'data4'],
        datasets: [
          {
            label: 'Sewing Time',
            data: [20, 34, 5, 67],
            backgroundColor: 'rgba(0, 229, 81, 1)',
            stack: 'Stack 0',
          },
          {
            label: 'Handling Time',
            data: [23, 56, 78, 9],
            backgroundColor: 'rgba(255, 255, 17, 1)',
            stack: 'Stack 0',
          },
          {
            label: 'Idle Time',
            data: [12, 34, 56, 78],
            backgroundColor: 'rgba(255, 159, 64, 1)',
            stack: 'Stack 0',
          },
          {
            label: 'Machine OFF Time',
            data: [23, 45, 67, 56],
            backgroundColor: 'rgba(255, 0, 136, 1)',
            stack: 'Stack 0',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {},
        onClick: async function (err, activeEls, tes) {
          console.log(err);
          console.log(activeEls);
          console.log(tes);
        },
      },
    });
    this.barChart.canvas.parentNode.style.height = '328px';

    this.barChart.canvas.parentNode.style.width = '428px';
  }

  pieCharts() {
    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: [
          'Sewing Time%',
          'Idle Time%',
          'Handling Time%',
          'Machine OFF Time%',
        ],
        datasets: [
          {
            //label:['Sewing Time', 'Handling Time', 'Idle Time','Machine OFF Time'],
            data: [20, 20, 50, 10],
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
        onClick: async function (err, activeEls) {
          console.log(err);
          console.log(activeEls);
        },
      },
    });

    this.pieChart.canvas.parentNode.style.height = '328px';

    this.pieChart.canvas.parentNode.style.width = '428px';
  }
}
