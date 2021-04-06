(function() {
  var f = window.__fuse = window.__fuse || {};
  var modules = f.modules = f.modules || {}; f.dt = function (x) { return x && x.__esModule ? x : { "default": x }; };

f.modules = modules;
  f.bundle = function(collection, fn) {
    for (var num in collection) {
      modules[num] = collection[num];
    }
    fn ? fn() : void 0;
  };
  f.c = {};
  f.r = function(id) {
    var cached = f.c[id];
    if (cached) return cached.m.exports;
    var module = modules[id];
    if (!module) {
      
      throw new Error('Module ' + id + ' was not found');
    }
    cached = f.c[id] = {};
    cached.exports = {};
    cached.m = { exports: cached.exports };
    module(f.r, cached.exports, cached.m);
    return cached.m.exports;
  }; 
})();
__fuse.bundle({

// index.ts @1
1: function(__fusereq, exports, module){
exports.__esModule = true;
var $ = __fusereq(3);
var chart_js_1 = __fusereq(6);
var chart_js_1d = __fuse.dt(chart_js_1);
const canvasWidth = 1000;
const canvasHeight = 1000;
var ctx = document.getElementById('chart');
var myChart = new chart_js_1d.default(ctx, {
  type: 'bar',
  data: {
    labels: ['Брезенхем(Цел.)', 'Брезенхем(Вещ.)', 'Брезенхем(сглаж.)', 'Библиотека', 'ДДА', 'Ву'],
    datasets: [{
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)'],
      borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
      borderWidth: 1
    }]
  },
  options: {
    responsive: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});
var signum = function (val) {
  if (val < 0) return -1;
  if (val > 0) return 1;
  return 0;
};
var fpart = function (val) {
  return val - Math.floor(val);
};
var rfpart = function (val) {
  return 1 - fpart(val);
};
var ipart = function (val) {
  return val - fpart(val);
};
var round = function (val) {
  return ipart(val + 0.5);
};
var getEndPoints = function (val, m) {
  let xe = Math.round(val.x);
  let ye = val.y + (xe - val.x) * m;
  return {
    px: Math.round(xe),
    py: Math.round(ye)
  };
};
class Dot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
var sketch = function (p) {
  var measureTimes = function () {
    let t0 = performance.now();
    let angle = 1;
    let start = new Dot(0, 0);
    let endc = new Dot(0, 0);
    for (var i = 0; i < 90.0; i += angle) {
      endc.x = p.cos(radians(i * angle)) * length;
      endc.y = p.sin(radians(i * angle)) * length;
      sketchBresenhemInt(start, endc);
    }
    let t1 = performance.now();
    console.log(t1 - t0, (t1 - t0) / 90);
    t0 = performance.now();
    angle = 1;
    for (var i = 0; i < 90.0; i += angle) {
      endc.x = p.cos(radians(i * angle)) * length;
      endc.y = p.sin(radians(i * angle)) * length;
      sketchBresenhemFloat(start, endc);
    }
    t1 = performance.now();
    console.log(t1 - t0, (t1 - t0) / 90);
  };
  var radians = function (angle) {
    var pi = Math.PI;
    return angle * (pi / 180.0);
  };
  p.setup = function () {
    p.createCanvas(canvasWidth, canvasHeight);
    p.strokeWeight(1);
  };
  $(".showStat").on('click', measureTimes);
  $(".drawButton").on('click', function (event) {
    let length = parseFloat(document.getElementById("lengthInput").value);
    let angle = parseFloat(document.getElementById("angle").value);
    let start = new Dot(0, 0);
    var sketch = sketchBresenhemInt;
    switch (event.target.id) {
      case "bresenhemInt":
        console.log("bresenhem Int");
        sketch = sketchBresenhemInt;
        break;
      case "bresenhemFloat":
        console.log("bresenhem Float");
        sketch = sketchBresenhemFloat;
        break;
      case "bresenhemAA":
        console.log("bresenhem AA");
        sketch = sketchBresenhemAA;
        break;
      case "dda":
        console.log("dda");
        sketch = sketchDDA;
        break;
      case "wu":
        console.log("wu");
        sketch = sketchWu;
        break;
      case "library":
        console.log("lib");
        break;
    }
    p.clear();
    p.push();
    p.translate(canvasWidth / 2, canvasHeight / 2);
    p.scale(1, -1);
    let endc = new Dot(0, 0);
    if (event.target.id === "library") {
      console.log("drawing libs");
      for (var i = 0; i < 360; i += angle) {
        endc.x = p.cos(radians(i * angle)) * length;
        endc.y = p.sin(radians(i * angle)) * length;
        p.line(start.x, start.y, endc.x, endc.y);
      }
    } else {
      p.beginShape(p.POINTS);
      for (var i = 0; i < 360; i += angle) {
        endc.x = p.cos(radians(i * angle)) * length;
        endc.y = p.sin(radians(i * angle)) * length;
        sketch(start, endc);
      }
      p.endShape();
    }
    p.pop();
  });
  function sketchBresenhemInt(a, b) {
    let startx = a.x, starty = a.y;
    let endx = b.x, endy = b.y;
    let dx = endx - startx, dy = endy - starty;
    let xsign = signum(dx);
    let ysign = signum(dy);
    let change = 0;
    dx = Math.abs(dx);
    dy = Math.abs(dy);
    if (dx < dy) {} else {
      [dx, dy] = [dy, dx];
      change = 1;
    }
    let e = 2 * dy - dx;
    let i = 0;
    let step = 1;
    let x = Math.round(startx), y = Math.round(starty);
    let buf_x = x, buf_y = y;
    while (i < dx + 1) {
      p.stroke(0, 0, 0);
      p.vertex(x, y);
      if (e >= 0) {
        if (change === 1) x += xsign; else y += ysign;
        e -= 2 * dx;
      }
      if (e <= 0) {
        if (change === 1) y += ysign; else x += xsign;
        e += 2 * dx;
      }
      i++;
      if (buf_x !== x && buf_y !== y) step++;
      (buf_x = x, buf_y = y);
    }
    return step;
  }
  function sketchBresenhemFloat(a, b) {
    let startx = a.x;
    let starty = a.y;
    let endx = b.x;
    let endy = b.y;
    let dx = endx - startx;
    let dy = endy - starty;
    let signx = signum(dx);
    let signy = signum(dy);
    dx = Math.abs(dx);
    dy = Math.abs(dy);
    let xx, xy, yx, yy;
    if (dx > dy) {
      xx = signx;
      xy = 0;
      yx = 0;
      yy = signy;
    } else {
      [dx, dy] = [dy, dx];
      xx = 0;
      xy = signy;
      yx = signx;
      yy = 0;
    }
    let m = dy / dx;
    let e = m - 0.5;
    let y = 0, x = 0;
    let step = 1;
    let buf_x = x, buf_y = y;
    while (x < dx + 1) {
      p.stroke(0, 0, 0, 255);
      p.vertex(startx + x * xx + y * yx, starty + x * xy + y * yy);
      if (e >= 0) {
        y++;
        e--;
      }
      e += m;
      x++;
      if (buf_x !== x && buf_y !== y) step++;
      buf_x = x;
      buf_y = y;
    }
    return step;
  }
  function sketchBresenhemAA(a, b) {
    dotBuffer = [];
    let startx = a.x;
    let starty = a.y;
    let endx = b.x;
    let endy = b.y;
    let dx = endx - startx;
    let dy = endy - starty;
    let signx = signum(dx);
    let signy = signum(dy);
    dx = Math.abs(dx);
    dy = Math.abs(dy);
    let xx, xy, yx, yy;
    if (dx > dy) {
      xx = signx;
      xy = 0;
      yx = 0;
      yy = signy;
    } else {
      [dx, dy] = [dy, dx];
      xx = 0;
      xy = signy;
      yx = signx;
      yy = 0;
    }
    let m = dy / dx;
    let e = 0.5;
    let w = 1;
    let y = 0, x = 0;
    let step = 1;
    let buf_x = x, buf_y = y;
    while (x < dx + 1) {
      p.stroke(0, 0, 0, 255 * e);
      p.vertex(startx + x * xx + y * yx, starty + x * xy + y * yy);
      if (e >= w - m) {
        y++;
        e -= w;
      }
      e += m;
      x++;
      if (buf_x !== x && buf_y !== y) step++;
      (buf_y = y, buf_x = x);
    }
    return step;
  }
  function sketchDDA(a, b) {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let l;
    if (Math.abs(dx) > Math.abs(dy)) l = Math.abs(dx); else l = Math.abs(dy);
    dx /= l;
    dy /= l;
    let x = a.x, y = a.y;
    p.stroke(0, 0, 0);
    p.vertex(x, y);
    let i = 0;
    let x_buf = x, y_buf = y;
    let step = 0;
    while (i < l) {
      x += dx;
      y += dy;
      p.stroke(0, 0, 0);
      p.vertex(x, y);
      if (Math.round(x_buf) != Math.round(x) && Math.round(y_buf) != Math.round(y)) step++;
      (x_buf = x, y_buf = y);
      i++;
    }
    return step;
  }
  function sketchWu(a, b) {
    let startx = a.x, starty = a.y, endx = b.x, endy = b.y;
    let steep = Math.abs(b.y - a.y) > Math.abs(b.x - a.x);
    if (steep) {
      [startx, starty] = [starty, startx];
      [endx, endy] = [endy, endx];
    }
    if (endx < startx) {
      [startx, endx] = [endx, startx];
      [starty, endy] = [endy, starty];
    }
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let m = dy / dx;
    let grad = dx === 0 ? 1 : m;
    let xpx11;
    let xend = round(startx), yend = starty + grad * (xend - startx);
    let xgap = rfpart(startx + 0.5);
    xpx11 = parseInt(xend.toString());
    let ypx11 = ipart(yend);
    let intery;
    if (steep) {
      p.stroke(0, 0, 0, rfpart(yend) * xgap * 255);
      p.vertex(ypx11, xpx11);
      p.stroke(0, 0, 0, fpart(yend) * xgap * 255);
      p.vertex(ypx11 + 1, xpx11);
    } else {
      p.stroke(0, 0, 0, rfpart(yend) * xgap * 255);
      p.vertex(xpx11, ypx11);
      p.stroke(0, 0, 0, fpart(yend) * xgap * 255);
      p.vertex(xpx11, ypx11 + 1);
    }
    intery = yend + grad;
    let xpx12;
    xend = round(endx);
    yend = endy + grad * (xend - endx);
    xgap = rfpart(endx + 0.5);
    xpx12 = parseInt(xend.toString());
    let ypx12 = ipart(yend);
    if (steep) {
      p.stroke(0, 0, 0, rfpart(yend) * xgap * 255);
      p.vertex(ypx12, xpx12);
      p.stroke(0, 0, 0, fpart(yend) * xgap * 255);
      p.vertex(ypx12 + 1, xpx12);
    } else {
      p.stroke(0, 0, 0, rfpart(yend) * xgap * 255);
      p.vertex(xpx12, ypx12);
      p.stroke(0, 0, 0, fpart(yend) * xgap * 255);
      p.vertex(xpx12, ypx12 + 1);
    }
    let step = 0;
    for (let x = xpx11 + 1; x < xpx12; x++) {
      if (steep) {
        p.stroke(0, 0, 0, rfpart(intery));
        p.vertex(ipart(intery), x);
        p.stroke(0, 0, 0, fpart(intery));
        p.vertex(ipart(intery) + 1, x);
      } else {
        p.stroke(0, 0, 0, rfpart(intery));
        p.vertex(x, ipart(intery));
        p.stroke(0, 0, 0, fpart(intery));
        p.vertex(x, ipart(intery));
      }
      if (ipart(intery) != ipart(intery + grad) && x < xpx12) step++;
      intery += grad;
    }
    return step;
  }
};
new p5(sketch);

}
})
//# sourceMappingURL=app.js.map