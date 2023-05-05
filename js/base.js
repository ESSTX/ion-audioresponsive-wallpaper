const googleimage = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAgAElEQVR4nO29eXwk1X3o+z1VvWgbSTPSDMzCjAQMmwcQxoDBk";

const STOPPED = 0;
const PLAYING = 1;
const PAUSED = 2;

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

const hexToRgba = (hex, alpha) => {
  const hexDigits = hex.substring(1).split('');
  const r = parseInt(hexDigits.slice(0, 2).join(''), 16);
  const g = parseInt(hexDigits.slice(2, 4).join(''), 16);
  const b = parseInt(hexDigits.slice(4, 6).join(''), 16);
  const a = alpha || 1;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const hexSetAlpha = (hex, alpha) => {
  const alphaInt = Math.round(alpha * 255);
  const alphaHex = alphaInt.toString(16).padStart(2, '0');
  const hexDigits = hex.substring(1).split('');
  hexDigits.splice(6, 2, alphaHex);
  return "#" + hexDigits.join('');
}

const rgbaSetAlpha = (rgba, alpha) => {
  const values = rgba.slice(5, -1).split(',');
  return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${alpha})`;
}

const rgbaToHex = (rgba) => {
  const [r, g, b, a] = rgba.split(/\(|\)|,/).slice(1, 5).map(val => parseInt(val));
  const alphaToHex = Math.round(a * 255).toString(16).padStart(2, '0');
  const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  return "#" + hex + alphaToHex;
}

const arrayRemove = (arr, value) => {
  return arr.filter(function (ele) {
    return ele != value;
  });
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
  let globalState = -1;
  let audio32 = 0;
  const drops = [];
  let gradient1 = "";
  let gradient2 = "";
  let visColor = 0;
  canvas.width = $("#audiovis").width();
  canvas.height = $("#audiovis").height();
  const thumbnail = document.getElementById('thumbnail');
  const calcHeightThumbnail = $("#thumbnail").width();
  let primaryColor = "#fff";

  function cacheElements() {
    return {
      fpsDisplay: $("#fpsDisplay"),
      thumbnail: $("#thumbnail"),
      thumbnailImage: $("#thumbnailimage"),
      body: $('body'),
      gradient: $("#gradient"),
      infoArtist: $("#infoArtist"),
      infoTrackName: $("#infoTrackName"),
      gigachadus: $(".gigachadus"),
    };
  }

  let elements = cacheElements();
  
  ///////////////////////////////
  ///
  ///     RAIN
  ///
  ///////////////////////////////
  let partsize = 0;
  class GigaDrop {
    constructor(maxX, maxY) {
      this.x = _.random(maxX);
      this.y = _.random(maxY);
      this.width = _.random(1, 3) * partsize;
      this.height = _.random(6, 18) * partsize;
      this.speed = this.height * 30;
    }

    update(deltaTime) {
      //let calcsp1 =
      this.y += ((this.speed) * audio32 * 100 * deltaTime);
      this.y += 10 * deltaTime;
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
  const spawnparts = (c) => {
    drops.length = 0;
    for (let i = 0; i < c; ++i) {
      drops.push(new GigaDrop(canvas.width, canvas.height));
    }
  }

  let fpsDisplayLag = 0;
  let gradientrotation = 0;
  let oldPartCount = 0;
  let partCount = 0;
  let audioArrayGlobal;
  let audioArrayDataSize = 64;
  let audioArrayGlobalSmooth;
  function drawVis(dt) {
    const visHeight = 1.0;
    if (!audioArrayGlobalSmooth) {
      audioArrayGlobalSmooth = new Array(audioArrayGlobal.length).fill(0);
    }
    let i = 1;
    while (i < audioArrayGlobal.length) {
      audioArrayGlobalSmooth[i] = lerp(audioArrayGlobalSmooth[i], audioArrayGlobal[i] * visHeight, 24 * dt);
      i++;
    }
    const barWidth = canvas.width / audioArrayGlobal.length;
    const barSpacing = barWidth * 0.2;
    for (let i = 0; i < audioArrayGlobal.length; i++) {
      let barHeight = audioArrayGlobalSmooth[i] * canvas.height;
      barHeight = Math.min(canvas.height, Math.max(0, barHeight));
      const x = (i * barWidth + i * barSpacing) - barWidth - barSpacing / 2;
      const y = canvas.height - barHeight;
      ctx.fillStyle = visColor;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  function drawLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(deltaTime);
    draw();

    if (oldPartCount !== partCount) {
      oldPartCount = partCount;
      spawnparts(partCount);
    }

    if (fpsDisplayLag >= 30) {
      const fps = Math.round(1 / deltaTime);
      elements.fpsDisplay.text(`FPS ${fps}`);
      fpsDisplayLag = 0;
    } else {
      fpsDisplayLag++;
    }

    updateVisualizer(elements, deltaTime);
    window.requestAnimationFrame(drawLoop);
  }

  let lastTime = performance.now();
  window.requestAnimationFrame(drawLoop);

  function updateVisualizer(elements, deltaTime) {
    if (!audioArrayGlobal) {
      return;
    }

    drawVis(deltaTime);
  }

  ///////////////////////////////
  ///
  ///     AUDIO LISTENER
  ///
  ///////////////////////////////
  let _impactforce = 0.1;
  let calc1max = 0;
  const AUDIOLISTENER = (audioArray) => {
    let size = 0;
    let slice = Math.round(audioArray.length / 24);//24 is mean detail
    for (let i = 0; i < audioArray.length; i += slice) {
      size += Math.min(audioArray[i], 0.6);
    }

    audioArrayGlobal = audioArray.slice(audioArrayDataSize);

    let calc0 = size * (_impactforce * 10);

    let calc1 = calcHeightThumbnail + calc0;

    // just auto adaptive thumbnail size to volume
    if (calc1 > calc1max) {
      calc1max = calc1;
    }
    if (calc1max > 620) {
      _impactforce = 4;
      calc1max = 0;
    } else if (calc1max > 500) {
      _impactforce -= 5;
      calc1max = 0;
    } else if (calc1max > 420) {
      _impactforce -= 1;
      calc1max = 0;
    } else {
      _impactforce += 0.1;
      calc1max = 0;
    }

    audio32 = Math.min(audioArray[80], 1);
    gradientrotation += calc0 / 100;

    $("#gradient").css("transform", "rotate(" + gradientrotation + "deg)");
    $("body").css("background-size", 100 + (size * 50) + "%");

    thumbnail.style.width = calc1 + "px";
    thumbnail.style.height = calc1 + "px";

    let bs1 = calc0 / 2;
    let bs2 = calc0 * 3; // BLUR
    let bs3 = -calc0;

    $("#thumbnail").css("box-shadow", primaryColor + ' 0px ' + bs1 + 'px ' + bs2 + 'px ' + bs3 + 'px ');

    let borderColor = rgbaSetAlpha(hexToRgba(primaryColor), size / 12);
    $("#thumbnail").css("border", (size) + "px solid " + borderColor);
  }

  ///////////////////////////////
  ///
  ///     THUMBNAIL
  ///
  ///////////////////////////////
  const THUMBNAIL = (event) => {
    let thumburlcut = event.thumbnail.replace("data:image/png;base64,", "");
    thumburlcut = thumburlcut.slice(0, googleimage.length);
    if (thumburlcut === googleimage || globalState === PAUSED) {
      globalState = STOPPED;
      return;
    }

    const thumbnail = elements.thumbnail;
    const thumbnailImage = elements.thumbnailImage;
    const body = elements.body;
    const gradient = elements.gradient;
    const infoArtist = elements.infoArtist;
    const infoTrackName = elements.infoTrackName;

    if (event.thumbnail === "data:image/png;base64,") {
      thumbnailImage.attr("src", "img/error.png");
      thumbnail.css("opacity", "1");
    } else {
      thumbnailImage.attr("src", event.thumbnail);
      thumbnail.css("opacity", "1");

      body.css('background-image', `url("${event.thumbnail}")`);
    }

    thumbnail.css("box-shadow", event.primaryColor + ' 0px 25px 50px -12px');
    primaryColor = event.primaryColor;

    gradient.css("background-image", `linear-gradient(${event.primaryColor}, ${event.secondaryColor})`);

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

    infoArtist.css("color", gradient1);
    infoTrackName.css("color", gradient2);
  }
  ///////////////////////////////
  ///
  ///     ARTIST&TRACK
  ///
  ///////////////////////////////
  const PLAYINGINFO = (event) => {
    if (globalState === PAUSED) {
      return;
    }

    const { gigachadus, thumbnail, infoArtist, infoTrackName } = elements;

    if (!gigachadus.hasClass('blur') && !thumbnail.hasClass('blur')) {
      gigachadus.addClass('blur');
      thumbnail.addClass('blur');

      setTimeout(() => {
        gigachadus.removeClass('blur');
        thumbnail.removeClass('blur');

        infoArtist.text(event.artist);
        infoTrackName.text(event.title);
      }, 200);
    }
  }
  ///////////////////////////////
  ///
  ///     PLAYBACK
  ///
  ///////////////////////////////
  const PLAYBACK = (event) => {
    globalState = event.state;

    switch (event.state) {
      case STOPPED:
        $("#infoArtist").text("");
        $("#infoTrackName").text("");
        $("#thumbnailimage").attr("src", "img/error.png");
        break;
      case PLAYING:
        $("#paused").css("opacity", "0");
        $("#paused").css("transform", "scale(0.5)");
        break;
      case PAUSED:
        $("#paused").css("opacity", "1");
        $("#paused").css("transform", "scale(1)");
        break;
      default:
        break;
    }

    $("#infoTrackName, #thumbnailimage").css("opacity", (event.state == STOPPED) ? "0" : "1");
  }
  window.wallpaperRegisterMediaPlaybackListener(PLAYBACK);
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

  const hideIfNoHref = (selector) => {
    if ($(selector).attr("href") == "") {
      $(selector).css("display", "none");
    } else {
      $(selector).css("display", "flex");
    }
  }

  window.wallpaperPropertyListener = {
    applyUserProperties: function (properties) {
      //console.log(properties);
      for (const [key, value] of Object.entries(properties)) {
        const value = properties[key].value;
        switch (key) {
          case "footericons":
            $("#footericons").css("display", value ? "flex" : "none");
            break;
          case "numpart":
            partCount = value;
            break;
          case "particlesize":
            partsize = value;
            break;
          case "rndedge":
            $(".thumbnail").css("border-radius", value + "%");
            break;
          case "glassblurstrength":
            $("#glass").css("backdrop-filter", `saturate(300%) blur(${value}px) brightness(120%)`);
            break;
          case "glassnoise":
            $(".noise").css("display", value ? "block" : "none");
            break;
          case "noiseblendmode":
            $("#noise").css("mix-blend-mode", value);
            break;
          case "noiseopacity":
            $("#noise").css("opacity", value);
            break;
          case "steamurl":
            $("#socialSteam").attr("href", value)
            hideIfNoHref("#socialSteam");
            break;
          case "discordurl":
            $("#socialDiscord").attr("href", value)
            hideIfNoHref("#socialDiscord");
            break;
          case "discordtag":
            $("#socialDiscordTag").text(value);
            hideIfNoHref("#socialDiscordTag");
            break;
          case "githuburl":
            $("#socialGithub").attr("href", value);
            hideIfNoHref("#socialGithub");
            break;
          case "artstationurl":
            $("#socialArtstation").attr("href", value);
            hideIfNoHref("#socialArtstation");
            break;
          case "vkurl":
            $("#socialVK").attr("href", value);
            hideIfNoHref("#socialVK");
            break;
          case "qqnumber":
            $("#socialQQ").attr("href", value);
            hideIfNoHref("#socialQQ");
            break;
          case "showfps":
            $("#fpsDisplay").css("display", value ? "block" : "none");
            break;
          case "visualizerheight":
            visHeight = value;
            break;
          /*case "visualizerplace":
            if (value == "outside") {
              visPlace = 1;
            } else {
              visPlace = 0;
            }
            break;*/
          case "visualizercolor":
            if (value == "primary") {
              visColor = gradient2;
            } else {
              visColor = gradient1;
            }
            break;
          case "visualizerdatasize":
            audioArrayDataSize = value;
            break;
          default:
            break;
        }
      }
    }
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