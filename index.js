var socket = io.connect();
var explodedValues = [2];

socket.on('retransmision_esp32', function(data){
    var cadena = `<div> <strong> &#128269; Dato:  <font color="orange">` + data + `</strong> </div>`;
    document.getElementById("div_dato").innerHTML = cadena;
    explodedValues[1] = parseFloat(data);
    drawVisualization();
});

socket.on('desde_servidor_comando', function(data){
    var cadena = `<div> <strong> &#128187; Comando:  <font color="green">` + data + `</strong> </div>`;
    document.getElementById("div_comando").innerHTML = cadena;
    explodedValues[0] = parseFloat(data);
    drawVisualization();
});

function drawVisualization() {
    var data = google.visualization.arrayToDataTable([
        ['Tracker', '1',{ role: 'style' }],
        ['Dato', explodedValues[0],'color: orange'],
        ['Otro dato', explodedValues[1],'color: blue']
    ]);

    var view = new google.visualization.DataView(data);
    view.setColumns([0, {
        type: 'number',
        label: data.getColumnLabel(1),
        calc: function () {return 0;}
    }]);

    var chart = new google.visualization.BarChart(document.getElementById('div_grafica'));

    var options = {
        title: "Monitoreo",
        width: 1200,
        height: 300,
        bar: { groupWidth: "95%" },
        legend: { position: "none" },
        animation: {
            duration: 0
        },
        hAxis: {
            minValue: 0,
            maxValue: 200
        }
    };

    var runOnce = google.visualization.events.addListener(chart, 'ready', function () {
        google.visualization.events.removeListener(runOnce);
        chart.draw(data, options);
    });

    chart.draw(view, options);
}

google.load('visualization', '1', {packages: ['corechart'], callback: drawVisualization});
