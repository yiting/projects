import photoswipeFromDom from './photoswipeFromDom';
import inlinePhotoswipe from './inlinePhotoswipe';

photoswipeFromDom('.showcase-gallery');

const inlineShowcaseEles = document.querySelectorAll('.showcase-gallery__inline');

const midAutumnSlides = [
  {
    src: 'assets/yqt/campaign/mid-autumn/index.jpg',
    w: 562,
    h: 1218,
    title: '活動首頁'
  },
  {
    src: 'assets/yqt/campaign/mid-autumn/produce.jpg',
    w: 562,
    h: 1218
  },
  {
    src: 'assets/yqt/campaign/mid-autumn/poster.jpg',
    w: 562,
    h: 1218
  },
];

const thanksgivingSlides = [
  {
    src: 'assets/yqt/campaign/thanksgiving/index.jpg',
    w: 562,
    h: 1218,
    title: '活動首頁'
  },
  {
    src: 'assets/yqt/campaign/thanksgiving/message.jpg',
    w: 562,
    h: 1218
  },
  {
    src: 'assets/yqt/campaign/thanksgiving/letter.jpg',
    w: 562,
    h: 1218
  },
  {
    videosrc: 'assets/yqt/campaign/thanksgiving/RPReplay_Final1607095077.mp4',
    w: 562,
    h: 1218,
    html: `<video controls muted disablePictureInPicture controlsList="nodownload" ` +
      `poster="assets/yqt/campaign/thanksgiving/letter.jpg">` +
      `<source src="assets/yqt/campaign/thanksgiving/RPReplay_Final1607095077.mp4" type="video/mp4">` +
      `</video>`,
  }
];

const wxgoldSlides = [
  {
    src: 'assets/wxgold/IMG_1566.jpg',
    w: 562,
    h: 1218,
    title: '金沙紅包'
  },
  {
    src: 'assets/wxgold/IMG_1567.jpg',
    w: 562,
    h: 1218
  },
  {
    src: 'assets/wxgold/IMG_1554.jpg',
    w: 562,
    h: 1218
  },
  {
    videosrc: 'assets/wxgold/RPReplay_Final1561480690.mp4',
    w: 562,
    h: 1218,
    html: `<video controls muted disablePictureInPicture controlsList="nodownload">` +
      `<source src="assets/wxgold/RPReplay_Final1561480690.mp4" type="video/mp4">` +
      `</video>`,
  }
];

const wecardSlides = [
  {
    src: 'assets/wecard/coupon-1.jpg',
    w: 540,
    h: 1170,
    title: '優惠券首頁'
  },
  {
    src: 'assets/wecard/coupon-2.jpg',
    w: 540,
    h: 1170,
  },
  {
    src: 'assets/wecard/coupon-3.jpg',
    w: 540,
    h: 1170,
  },
  {
    src: 'assets/wecard/pt-index.jpg',
    w: 562,
    h: 1444,
  },
  {
    src: 'assets/wecard/pt-invited.jpg',
    w: 562,
    h: 1218,
  },
  {
    videosrc: 'assets/wecard/RPReplay_Final1561606039.mp4',
    w: 562,
    h: 1218,
    html: `<video controls muted disablePictureInPicture controlsList="nodownload" poster="assets/wecard/event-618.jpg">` +
      `<source src="assets/wecard/RPReplay_Final1561606039.mp4" type="video/mp4">` +
      `</video>`,
  }
];

inlineShowcaseEles.forEach(el => {
  if (el.dataset.slide === 'mid-autumn') {
    new inlinePhotoswipe(el, midAutumnSlides).init();
  } else if (el.dataset.slide === 'thanksgiving') {
    new inlinePhotoswipe(el, thanksgivingSlides).init();
  } else if (el.dataset.slide === 'wxgold') {
    new inlinePhotoswipe(el, wxgoldSlides).init();
  } else if (el.dataset.slide === 'wecard') {
    new inlinePhotoswipe(el, wecardSlides).init();
  }
});
