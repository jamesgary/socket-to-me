$(function() {
  var $behaviorBtns = $('.behaviors button');
  var $server       = $('#server');
  var $upstream     = $('#upstream');
  var $downstream   = $('#downstream');
  var $fps          = $('#fps');
  var $runBtn       = $('#run');
  var $startStopBtn = $('#start-stop');

  var $count   = $('#count');
  var $average = $('#average');
  var $stdDev  = $('#std-dev');
  var $top10   = $('#top-10');
  var $top1    = $('#top-1');
  var $max     = $('#max');

  var ws, lastTime, recordedTimes, running, chart, chartTimeSeries;

  var storedServer = localStorage['server'];
  if (storedServer) $server.val(storedServer);

  var currentBehavior = 'pingpong';

  $behaviorBtns.click(function() {
    $behaviorBtns.removeClass('active');
    $(this).addClass('active');
    $('.pingpong, .firehose').hide();
    $("." + this.id).show();
    currentBehavior = this.id;
  });

  $startStopBtn.click(function() {
    if (running) {
      stop();
      $startStopBtn.addClass('btn-success');
      $startStopBtn.removeClass('btn-danger');
      $runBtn.removeAttr('disabled');
    } else {
      start();
      $startStopBtn.addClass('btn-danger');
      $startStopBtn.removeClass('btn-success');
      $runBtn.attr('disabled', 'disabled');
    }
  });

  $runBtn.click(function() {
    $runBtn.attr('disabled', 'disabled');
    $startStopBtn.attr('disabled', 'disabled');
    start();
    setTimeout(function() {
      $runBtn.removeAttr('disabled');
      $startStopBtn.removeAttr('disabled');
      stop();
    }, 5000);
  });

  function start() {
    localStorage['server'] = $server.val();
    running = true;
    // TODO Handle urls with parameters already added
    switch(currentBehavior) {
    case 'pingpong':
      ws = new WebSocket("ws://" + $server.val() + "?pong=" + escape($downstream.val()));
      ws.onopen = function() {
        recordedTimes = [];
        startTimer();
        sendMsg();
      }
      ws.onmessage = function(msg) {
        endTimer();
        compileResults();
        startTimer();
        sendMsg();
      }
      break;
    case 'firehose':
      ws = new WebSocket(
        "ws://" + $server.val() +
        "?response=" + escape($downstream.val()) +
        "&fps=" + ($fps.val() || $fps.attr('placeholder')));
      ws.onopen = function() {
        recordedTimes = [];
        startTimer();
      }
      ws.onmessage = function(msg) {
        endTimer();
        startTimer();
        compileResults();
        for(var i = 0; i < 10; i++) {
          $('body').append('|');
        }
      }
      break;
    }
    chart = new SmoothieChart();
    chart.streamTo(document.getElementById('chart'));
    chartTimeSeries = new TimeSeries();
    chart.addTimeSeries(chartTimeSeries);
  }

  function stop() {
    running = false;
    if (ws) ws.close();
    compileResults();
  }

  function sendMsg() {
    ws.send($upstream);
  }

  function compileResults() {
    chartTimeSeries.append(now(), recordedTimes[recordedTimes.length - 1]);

    var count = recordedTimes.length;
    var tmpSum = 0;
    recordedTimes.forEach(function(t) { tmpSum += t });
    var avg = tmpSum / count;

    tmpSum = 0;
    recordedTimes.forEach(function(t) { tmpSum += Math.pow(avg - t, 2) });
    var stdDev = Math.sqrt(tmpSum / count);

    tmpSum = 0;
    recordedTimes.sort(function(a, b) { return a - b }).reverse();
    for (var i = 0; i <= count / 10; i++) {
      tmpSum += recordedTimes[i];
    }
    var top10 = tmpSum / (count / 10);

    tmpSum = 0;
    for (var i = 0; i <= count / 100; i++) {
      tmpSum += recordedTimes[i];
    }
    var top1 = tmpSum / (count / 100);
    var max = recordedTimes[0];

    $count.html(count);
    $average.html(prettify(avg));
    $stdDev.html(prettify(stdDev));
    $top10.html(prettify(top10));
    $top1.html(prettify(top1));
    $max.html(max + " ms");

    function prettify(num) {
      var precision = 3;
      var factor = Math.pow(10, precision);
      return Math.round(num * factor) / factor + " ms";
    }
  }

  function startTimer() {
    lastTime = now();
  }

  function endTimer() {
    recordedTimes.push(now() - lastTime);
  }

  function now() {
    return new Date().getTime();
  }
});
