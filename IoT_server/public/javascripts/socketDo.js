var socket = io.connect();
var timer = null;

//get date value
var today = new Date();
var line = "";
var chartTime = [];
var hours = [];

//good value
var inTp = [0];
var inHd = [0];
var inCo2 = [0];

//now value
var tmp = [0, 0, 0, 0, 0];
var hum = [0, 0, 0, 0, 0];
var Co2 = [0, 0, 0, 0, 0];

//버튼을 누르면 어떤data도 받지 않는 상태
var check = false;

//index
var index1 = 0, index2 = 0, index3 = 0;

var tmpvalue = 0, humvalue = 0, Co2value = 0;

//google chart
google.load("visualization", "1", { packages: ["corechart"] });
google.setOnLoadCallback(drawChart);

//main
$(document).ready(function () {

    socket.on("socket_up_inTp", function (data) {
        data = JSON.parse(data);
        inTp[index1] = data.inTp;
        index1++;
    });
    socket.on("socket_up_inHd", function (data) {
        data = JSON.parse(data);
        inHd[index2] = data.inHd;
        index2++;
    });
    socket.on("socket_up_inCo2", function (data) {
        data = JSON.parse(data);
        inCo2[index3] = data.inCo2;
        index3++;
    });

    socket.on("socket_up_tmp", function (data) {
        data = JSON.parse(data);
        tmp.push(data.tmp + tmpvalue);
        if (tmp.length == 6) {
            tmp.splice(0, 1);
        }
        drawChart();
    });

    socket.on("socket_up_hum", function (data) {
        data = JSON.parse(data);
        hum.push(data.hum + humvalue);
        if (hum.length == 6) {
            hum.splice(0, 1);
        }
        drawChart();
    });

    socket.on("socket_up_Co2", function (data) {
        data = JSON.parse(data);
        Co2.push(data.Co2 + Co2value);
        if (Co2.length == 6) {
            Co2.splice(0, 1);
        }
        drawChart();
    });

    if (timer == null) {
        timer = window.setInterval("getNow();", 3000);
    }

    submitDate();
    controlData();

});

//db에서 가져오도록 하는 tigger 함수 
function getDB() {
    socket.emit("socket_evt_update", JSON.stringify({}));
}

//차트 그리기
function drawChart() {
    CTfunc();

    //온도
    var data_inTp = google.visualization.arrayToDataTable([
        ['Date', 'Good', 'Now'],
        [chartTime[4], inTp[4], tmp[0]],
        [chartTime[3], inTp[3], tmp[1]],
        [chartTime[2], inTp[2], tmp[2]],
        [chartTime[1], inTp[1], tmp[3]],
        [chartTime[0], inTp[0], tmp[4]]
    ]);

    var options_inTp = {
        title: 'Temperature(' + tmp[4] + ')'
    };
    //습도
    var data_inHd = google.visualization.arrayToDataTable([
        ['Date', 'Good', 'Now'],
        [chartTime[4], inHd[4], hum[0]],
        [chartTime[3], inHd[3], hum[1]],
        [chartTime[2], inHd[2], hum[2]],
        [chartTime[1], inHd[1], hum[3]],
        [chartTime[0], inHd[0], hum[4]]
    ]);

    var options_inHd = {
        title: 'Humidity(' + hum[4] + ')'
    };
    //Co2
    var data_inCo2 = google.visualization.arrayToDataTable([
        ['Date', 'Good', 'Now'],
        [chartTime[4], inCo2[4], Co2[0]],
        [chartTime[3], inCo2[3], Co2[1]],
        [chartTime[2], inCo2[2], Co2[2]],
        [chartTime[1], inCo2[1], Co2[3]],
        [chartTime[0], inCo2[0], Co2[4]]
    ]);

    var options_inCo2 = {
        title: 'Co2(' + Co2[4] + ')'
    };

    var chart = new google.visualization.LineChart(document.getElementById('chart_div1'));
    var chart2 = new google.visualization.LineChart(document.getElementById('chart_div2'));
    var chart3 = new google.visualization.LineChart(document.getElementById('chart_div3'));
    chart.draw(data_inTp, options_inTp);
    chart2.draw(data_inHd, options_inHd);
    chart3.draw(data_inCo2, options_inCo2);
}

//날자 선택시 동작
function submitDate() {
    //get date
    $('#submit').on('click', function () {
        date = new Date($('#date-input').val());
        check = true;

        index1 = 0;
        index2 = 0;
        index3 = 0;

        line = "";

        year = date.getFullYear();

        if ((date.getMonth() + 1) < 10) {
            month = "0" + (date.getMonth() + 1);
        }
        else {
            month = date.getMonth() + 1;
        }

        if (date.getDate() < 10) {
            day = "0" + (date.getDate());
        }
        else {
            day = date.getDate();
        }

        for (var i = 0; i < 5; i++) {

            if (today.getHours() < 10) {
                switch (today.getHours()) {
                    case 0:
                        hours = ["00", "23", "22", "21", "20"]
                        break;
                    case 1:
                        hours = ["01", "00", "23", "22", "21"]
                        break;
                    case 2:
                        hours = ["02", "01", "00", "23", "22"]
                        break;
                    case 3:
                        hours = ["03", "02", "01", "00", "23"]
                        break;
                    default:
                        hours[i] = "0" + (today.getHours() - i);
                }
            }
            else {
                if ((today.getHours() - i) < 10) {
                    hours[i] = "0" + (today.getHours() - i);
                } else {
                    hours[i] = today.getHours() - i;
                }
            }

            if (i == 4) {
                line += year + "" + month + "" + day + "" + hours[i];
            } else {
                line += year + "" + month + "" + day + "" + hours[i] + ",";
            }
        }

        socket.emit("socket_req_date", line)

        sleep(8000);

        getDB();

        check = false;
    });
}

//데이터 조정
function controlData() {
    $('#tmp_up_btn').on('click', function () {
        tmpvalue++;
        $('#tmpMoniter').html(tmpvalue);
    });

    $('#tmp_down_btn').on('click', function () {
        tmpvalue--;
        $('#tmpMoniter').html(tmpvalue);
    });

    $('#hum_up_btn').on('click', function () {
        humvalue++;
        $('#humMoniter').html(humvalue);
    });

    $('#hum_down_btn').on('click', function () {
        humvalue--;
        $('#humMoniter').html(humvalue);
    });

    $('#Co2_up_btn').on('click', function () {
        Co2value++;
        $('#Co2Moniter').html(Co2value);
    });

    $('#Co2_down_btn').on('click', function () {
        Co2value--;
        $('#Co2Moniter').html(Co2value);
    });
}

//차트시간 갱신
function CTfunc() {
    for (var i = 0; i < 5; i++) {
        if (today.getHours() < 10) {
            switch (today.getHours()) {
                case 0:
                    chartTime = ["00시", "23시", "22시", "21시", "20시"]
                    break;
                case 1:
                    chartTime = ["01시", "00시", "23시", "22시", "21시"]
                    break;
                case 2:
                    chartTime = ["02시", "01시", "00시", "23시", "22시"]
                    break;
                case 3:
                    chartTime = ["03시", "02시", "01시", "00시", "23시"]
                    break;
                default:
                    chartTime[i] = "0" + (today.getHours() - i) + "시";
            }
        }
        else {
            chartTime[i] = (today.getHours() - i) + "시";
        }
    }
}

//지속적으로 들어오는 Now data받는
function getNow() {
    if (check == false) {
        socket.emit("socket_up_getNow", JSON.stringify({}));
    }
}

//sleep구현
function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}