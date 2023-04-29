const lerp = (a, b, n) => {
  return (b - a) * n + a;
}

const clamp = (num, min, max) => {
  return Math.min(Math.max(num, min), max);
}

const percentageTimeLine = (part, whole) => {
  return (100 * part / whole).toFixed(2);
}

const getLuma = (color) => {
  const hexRegExp = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const result = hexRegExp.exec(color);
  const [, r, g, b] = result ? result : [0, 0, 0, 0];
  return (0.299 * parseInt(r, 16) + 0.587 * parseInt(g, 16) + 0.114 * parseInt(b, 16));
};

const addLuma = (color, amount) => {
  const [r, g, b] = hexToRgb(color);
  const hsl = rgbToHsl(r, g, b);
  const l = _.clamp(hsl[2] + amount, 0, 1);
  const rgb = hslToRgb(hsl[0], hsl[1], l);
  return rgbToHex(rgb);
}

const hexToRgb = (hex) => {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
}

const rgbToHsl = (r, g, b) => {
  r /= 255, g /= 255, b /= 255;
  const [max, min] = [r, g, b].reduce((acc, cur) => [Math.max(cur, acc[0]), Math.min(cur, acc[1])], [0, 1]);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

const hslToRgb = (h, s, l) => {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [_.round(r * 255), _.round(g * 255), _.round(b * 255)];
}

const rgbToHex = ([r, g, b]) => {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const checkColor = (color) => {
  const [r, g, b] = hexToRgb(color);
  if (r > g && r > b) {
    return 'red';
  } else if (g > r && g > b) {
    return 'green';
  } else if (b > r && b > g) {
    return 'blue';
  } else {
    return 'neutral';
  }
}

const init = () => {
  const canvas = document.getElementById('audiovis');
  const ctx = canvas.getContext('2d');

  // Make rain sync with music
  let audio32 = 0;

  const drops = [];

  let gradient1 = "";
  let gradient2 = "";

  canvas.width = $("#audiovis").width();
  canvas.height = $("#audiovis").height();

  const thumbnail = document.getElementById('thumbnail');

  //Get calculated height for thumbnail
  const calcHeightThumbnail = $("#thumbnail").width();
  const calcBGSizeThumbnail = $("#thumbnail").css('background-size');

  // Make thumbnail shadow sync with AUDIOOO
  let primaryColor = "#fff";

  ///////////////////////////////
  ///
  ///     RAIN
  ///
  ///////////////////////////////
  class GigaDrop {
    constructor(maxX, maxY) {
      this.x = _.random(maxX);
      this.y = _.random(maxY);
      this.width = _.random(1, 3);
      this.height = _.random(6, 18);
      this.speed = this.height * 30;
    }

    update(deltaTime) {
      this.y += (this.speed * (audio32 * 100)) * deltaTime;
      if (this.y > $(window).height()) {
        this.x = _.random($(window).width());
        this.y = -this.height;
      }
    }
    draw() {
      ctx.beginPath();

      // glow
      ctx.shadowColor = gradient2;
      ctx.shadowBlur = 24;
      const g = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        0,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2
      );
      ctx.fillStyle = gradient2;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  const update = (deltaTime) => {
    for (let i = 0; i < drops.length; i++) {
      drops[i].update(deltaTime);
    }
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < drops.length; i++) {
      drops[i].draw();
    }
  }
  let fpsDisplayLag = 0;
  const loop = (timestamp) => {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(deltaTime);
    draw();

    if (fpsDisplayLag > 10) {
      const fps = Math.round(1 / deltaTime);
      $("#fpsDisplay").text(fps + " FPS");
      fpsDisplayLag = 0;
    } else { fpsDisplayLag++; }


    window.requestAnimationFrame(loop);
  }

  let lastTime = 0;

  for (let i = 0; i < 100; i++) {
    drops.push(new GigaDrop(canvas.width, canvas.height));
  }

  window.requestAnimationFrame(loop);

  ///////////////////////////////
  ///
  ///     AUDIO LISTENER
  ///
  ///////////////////////////////
  const AUDIOLISTENER = (audioArray) => {

    let calc0 = audioArray[12] * 2000;
    let calc1 = calcHeightThumbnail + calc0;
    //let calc2 = parseInt(calcBGSizeThumbnail) + calc0;

    //let calc3 = audioArray[12] * 200;
    //$("#gradient").css("rotate",  calc3+"deg");

    audio32 = audioArray[80];

    let calc1clamped = clamp(calc1, 100, 550);
    //let calc2clamped = clamp(calc2, 100, 550);

    thumbnail.style.width = calc1clamped + "px";
    thumbnail.style.height = calc1clamped + "px";

    //$("#debug_num").text(calc2clamped);

    let bs1 = calc0 / 2;
    let bs2 = calc0 * 3; //blur
    let bs3 = -calc0;

    /* offset-x | offset-y | blur-radius | spread-radius | color */

    $("#thumbnail").css("box-shadow", primaryColor + ' 0px ' + bs1 + 'px ' + bs2 + 'px ' + bs3 + 'px ')
  }

  albumCoverArt = document.getElementById('albumCoverArt');
  trackTitle = document.getElementById('trackTitle');
  artist = document.getElementById('artist');
  ///////////////////////////////
  ///
  ///     THUMBNAIL
  ///
  ///////////////////////////////


  const THUMBNAIL = (event) => {

    if (!event.thumbnail) {
      console.log("error");
    }

    //$("#thumbnail").css("background-image", 'url('+event.thumbnail+')')
    $("#thumbnailimage").attr("src", event.thumbnail);
    $("#thumbnail").css("box-shadow", event.primaryColor + ' 0px 25px 50px -12px')
    primaryColor = event.primaryColor;

    $("#gradient").css("background-image", 'linear-gradient(' + event.primaryColor + ', ' + event.secondaryColor + ')')
    //console.log(getLuma(event.secondaryColor));
    //gradient1 = event.primaryColor;
    if (getLuma(event.primaryColor) < 10) {
      gradient2 = addLuma(event.primaryColor, 0.55);
    } else if (getLuma(event.primaryColor) < 30) {
      gradient2 = addLuma(event.primaryColor, 0.4);
    } else if (getLuma(event.primaryColor) < 50) {
      gradient2 = addLuma(event.primaryColor, 0.2);
    } else {
      gradient2 = event.primaryColor;
    }

    if (getLuma(event.textColor) < 10) {
      gradient1 = addLuma(event.textColor, 0.55);
    } else if (getLuma(event.textColor) < 30) {
      gradient1 = addLuma(event.textColor, 0.4);
    } else if (getLuma(event.textColor) < 50) {
      gradient1 = addLuma(event.textColor, 0.2);
    } else {
      gradient1 = event.textColor;
    }

    //trackTitle.style.color = event.textColor;
    //artist.style.color = event.textColor;

    $("#infoArtist").css("color", gradient1);
    $("#infoTrackName").css("color", gradient2);
  }
  ///////////////////////////////
  ///
  ///     ARTIST&TRACK
  ///
  ///////////////////////////////
  const PLAYINGINFO = (event) => {
    let textElements = $('.gigachadus, .thumbnail');

    _.forEach(textElements, (element) => {
      element.classList.add('blur');
    });

    setTimeout(() => {
      let textElements = $('.gigachadus, .thumbnail');
      _.forEach(textElements, (element) => {
        element.classList.remove('blur');
      });
      $("#infoArtist").text(event.artist);
      $("#infoTrackName").text(event.title);
    }, "200");
  }
  window.wallpaperRegisterAudioListener(AUDIOLISTENER);
  window.wallpaperRegisterMediaThumbnailListener(THUMBNAIL);
  window.wallpaperRegisterMediaPropertiesListener(PLAYINGINFO);

  ///////////////////////////////
  ///
  ///
  ///
  ///////////////////////////////
  const $glass = $('#glass');
  const $content = $('#content');
  const constrain = 2600;

  function transforms(x, y, el) {
    const box = el.getBoundingClientRect();
    const calcX = -(y - box.y - (box.height / 2)) / constrain;
    const calcY = (x - box.x - (box.width / 2)) / constrain;
    return `perspective(100px) rotateX(${calcX}deg) rotateY(${calcY}deg)`;
  }
  function transformElement(xyEl) {
    $glass.css({ transform: transforms(...xyEl) });
  }
  $content.on('mousemove', _.throttle(function (e) {
    const xy = [e.clientX, e.clientY];
    const position = xy.concat([$glass[0]]);
    window.requestAnimationFrame(function () {
      transformElement(position);
    });
  }, 16.67));

  $(".social-icon-wrapper").hover(
    function () {
      $("#texturl").addClass("texturl--active");
      $("#texturl").text($(this).attr('href'));
    },
    function () {
      $("#texturl").removeClass("texturl--active");
    }
  );

  window.wallpaperPropertyListener = {
    applyUserProperties: function (properties) {
      var footericons = properties.footericons.value;
      if (!footericons) {
        $("#footericons").css("display", "none");
      } else {
        $("#footericons").css("display", "flex");
      }
    },
  };
}

const initPage = () => {
  let textElements = $('h1, h2, h3, h4, h5, h6, p, span');
  const font = new FontFace('Poppins', 'url(fonts/poppins.woff2)', {
    style: "normal",
    weight: "400",
    display: "swap",
  });
  font.load().then(() => {
    document.fonts.add(font);
    _.forEach(textElements, (element) => {
      element.classList.remove('loading-font');
      element.classList.add('white');
    });
    textElements = [];
    init();
  }).catch((error) => {
    console.error(`Failed to load font: ${error}`);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  let textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span');
  for (let i = 0; i < textElements.length; i++) {
    textElements[i].classList.add('loading-font');
  }
  textElements = [];

  let libs = [
    "js/jquery-3.6.4.min.js",
    "js/lodash.min.js"
  ];

  let scriptElements = [];
  let downloadedCount = 0;

  for (let i = 0; i < libs.length; i++) {
    var scr = document.createElement("script");
    scr.setAttribute("src", libs[i]);
    scr.setAttribute("async", true);
    document.head.appendChild(scr);
    scriptElements.push(scr);

    scr.addEventListener('load', () => {
      downloadedCount++;
      if (downloadedCount === libs.length) {
        initPage();
      }
    });
  }
});