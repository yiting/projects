'use strict';

var initPhotoSwipeFromDOM = function initPhotoSwipeFromDOM(gallerySelector) {
  // parse slide data (url, title, size ...) from DOM elements 
  // (children of gallerySelector)
  var parseThumbnailElements = function parseThumbnailElements(el) {
    var thumbElements = el.childNodes,
      numNodes = thumbElements.length,
      items = [],
      figureEl,
      linkEl,
      size,
      item;
    for (var i = 0; i < numNodes; i++) {
      figureEl = thumbElements[i]; // <figure> element

      // include only element nodes 
      if (figureEl.nodeType !== 1) {
        continue;
      }
      linkEl = figureEl.children[0]; // <a> element

      size = linkEl.getAttribute('data-size').split('x');

      // create slide object
      item = {
        src: linkEl.getAttribute('href'),
        w: parseInt(size[0], 10),
        h: parseInt(size[1], 10)
      };
      if (figureEl.children.length > 1) {
        // <figcaption> content
        item.title = figureEl.children[1].innerHTML;
      }
      if (linkEl.children.length > 0) {
        // <img> thumbnail element, retrieving thumbnail url
        item.msrc = linkEl.children[0].getAttribute('src');
      }
      item.el = figureEl; // save link to element for getThumbBoundsFn
      items.push(item);
    }
    return items;
  };

  // find nearest parent element
  var closest = function closest(el, fn) {
    return el && (fn(el) ? el : closest(el.parentNode, fn));
  };

  // triggers when user clicks on thumbnail
  var onThumbnailsClick = function onThumbnailsClick(e) {
    e = e || window.event;
    e.preventDefault ? e.preventDefault() : e.returnValue = false;
    var eTarget = e.target || e.srcElement;

    // find root element of slide
    var clickedListItem = closest(eTarget, function (el) {
      return el.tagName && el.tagName.toUpperCase() === 'FIGURE';
    });
    if (!clickedListItem) {
      return;
    }

    // find index of clicked item by looping through all child nodes
    // alternatively, you may define index via data- attribute
    var clickedGallery = clickedListItem.parentNode,
      childNodes = clickedListItem.parentNode.childNodes,
      numChildNodes = childNodes.length,
      nodeIndex = 0,
      index;
    for (var i = 0; i < numChildNodes; i++) {
      if (childNodes[i].nodeType !== 1) {
        continue;
      }
      if (childNodes[i] === clickedListItem) {
        index = nodeIndex;
        break;
      }
      nodeIndex++;
    }
    if (index >= 0) {
      // open PhotoSwipe if valid index found
      openPhotoSwipe(index, clickedGallery);
    }
    return false;
  };

  // parse picture index and gallery index from URL (#&pid=1&gid=2)
  var photoswipeParseHash = function photoswipeParseHash() {
    var hash = window.location.hash.substring(1),
      params = {};
    if (hash.length < 5) {
      return params;
    }
    var vars = hash.split('&');
    for (var i = 0; i < vars.length; i++) {
      if (!vars[i]) {
        continue;
      }
      var pair = vars[i].split('=');
      if (pair.length < 2) {
        continue;
      }
      params[pair[0]] = pair[1];
    }
    if (params.gid) {
      params.gid = parseInt(params.gid, 10);
    }
    return params;
  };
  var openPhotoSwipe = function openPhotoSwipe(index, galleryElement, disableAnimation, fromURL) {
    var pswpElement = document.querySelectorAll('.pswp')[0],
      gallery,
      options,
      items;
    items = parseThumbnailElements(galleryElement);

    // define options (if needed)
    options = {
      // define gallery index (for URL)
      galleryUID: galleryElement.getAttribute('data-pswp-uid'),
      getThumbBoundsFn: function (index) {
        // See Options -> getThumbBoundsFn section of documentation for more info
        var thumbnail = items[index].el.getElementsByTagName('img')[0],
          // find thumbnail
          pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
          rect = thumbnail.getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top + pageYScroll,
          w: rect.width
        };
      }
    };

    // PhotoSwipe opened from URL
    if (fromURL) {
      if (options.galleryPIDs) {
        // parse real index when custom PIDs are used 
        // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
        for (var j = 0; j < items.length; j++) {
          if (items[j].pid == index) {
            options.index = j;
            break;
          }
        }
      } else {
        // in URL indexes start from 1
        options.index = parseInt(index, 10) - 1;
      }
    } else {
      options.index = parseInt(index, 10);
    }

    // exit if index not found
    if (isNaN(options.index)) {
      return;
    }
    if (disableAnimation) {
      options.showAnimationDuration = 0;
    }

    // Pass data to PhotoSwipe and initialize it
    gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();
  };

  // loop through all gallery elements and bind events
  var galleryElements = document.querySelectorAll(gallerySelector);
  for (var i = 0, l = galleryElements.length; i < l; i++) {
    galleryElements[i].setAttribute('data-pswp-uid', i + 1);
    galleryElements[i].onclick = onThumbnailsClick;
  }

  // console.log('galleryElements =>', galleryElements);

  // Parse URL and open gallery if it contains #&pid=3&gid=1
  var hashData = photoswipeParseHash();
  if (hashData.pid && hashData.gid) {
    openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
  }
};

class InlinePhotoswipe {
  constructor(pswpNode, items) {
    this.pswpNode = pswpNode || null;
    this.items = items || [];
    this.options = {
      index: 0,
      history: false,
      focus: false,
      modal: false,
      closeOnScroll: false,
      closeOnVerticalDrag: false,
      closeEl: false,
      closeElClasses: [],
      shareEl: false,
      shareButtons: []
    };
    this.photoSwipeInst = null;
  }
  init() {
    if (!this.pswpNode || this.items.length === 0) return;

    // Initializes and opens PhotoSwipe
    this.photoSwipeInst = new PhotoSwipe(this.pswpNode, PhotoSwipeUI_Default, this.items, this.options);
    this.photoSwipeInst.init();
    this.photoSwipeInst.listen('afterChange', function () {
      const curItem = this.currItem;
      // slide to one video item and autoplay video
      if (curItem.videosrc) {
        const videoNode = curItem.container.children[0];
        setTimeout(() => {
          videoNode && videoNode.play();
        }, 500);
      }
      // slide to a not video item pause all video items
      else {
        // container
        const parentNode = curItem.container.parentNode.parentNode;
        const videoList = parentNode.querySelectorAll('video');
        videoList.forEach(vi => {
          vi.pause();
        });
      }
    });
  }
}

initPhotoSwipeFromDOM('.showcase-gallery');
const inlineShowcaseEles = document.querySelectorAll('.showcase-gallery__inline');
const midAutumnSlides = [{
  src: 'assets/yqt/campaign/mid-autumn/index.jpg',
  w: 562,
  h: 1218,
  title: '活動首頁'
}, {
  src: 'assets/yqt/campaign/mid-autumn/produce.jpg',
  w: 562,
  h: 1218
}, {
  src: 'assets/yqt/campaign/mid-autumn/poster.jpg',
  w: 562,
  h: 1218
}];
const thanksgivingSlides = [{
  src: 'assets/yqt/campaign/thanksgiving/index.jpg',
  w: 562,
  h: 1218,
  title: '活動首頁'
}, {
  src: 'assets/yqt/campaign/thanksgiving/message.jpg',
  w: 562,
  h: 1218
}, {
  src: 'assets/yqt/campaign/thanksgiving/letter.jpg',
  w: 562,
  h: 1218
}, {
  videosrc: 'assets/yqt/campaign/thanksgiving/RPReplay_Final1607095077.mp4',
  w: 562,
  h: 1218,
  html: `<video controls muted disablePictureInPicture controlsList="nodownload" ` + `poster="assets/yqt/campaign/thanksgiving/letter.jpg">` + `<source src="assets/yqt/campaign/thanksgiving/RPReplay_Final1607095077.mp4" type="video/mp4">` + `</video>`
}];
const wxgoldSlides = [{
  src: 'assets/wxgold/IMG_1566.jpg',
  w: 562,
  h: 1218,
  title: '金沙紅包'
}, {
  src: 'assets/wxgold/IMG_1567.jpg',
  w: 562,
  h: 1218
}, {
  src: 'assets/wxgold/IMG_1554.jpg',
  w: 562,
  h: 1218
}, {
  videosrc: 'assets/wxgold/RPReplay_Final1561480690.mp4',
  w: 562,
  h: 1218,
  html: `<video controls muted disablePictureInPicture controlsList="nodownload">` + `<source src="assets/wxgold/RPReplay_Final1561480690.mp4" type="video/mp4">` + `</video>`
}];
const wecardSlides = [{
  src: 'assets/wecard/coupon-1.jpg',
  w: 540,
  h: 1170,
  title: '優惠券首頁'
}, {
  src: 'assets/wecard/coupon-2.jpg',
  w: 540,
  h: 1170
}, {
  src: 'assets/wecard/coupon-3.jpg',
  w: 540,
  h: 1170
}, {
  src: 'assets/wecard/pt-index.jpg',
  w: 562,
  h: 1444
}, {
  src: 'assets/wecard/pt-invited.jpg',
  w: 562,
  h: 1218
}, {
  videosrc: 'assets/wecard/RPReplay_Final1561606039.mp4',
  w: 562,
  h: 1218,
  html: `<video controls muted disablePictureInPicture controlsList="nodownload" poster="assets/wecard/event-618.jpg">` + `<source src="assets/wecard/RPReplay_Final1561606039.mp4" type="video/mp4">` + `</video>`
}];
inlineShowcaseEles.forEach(el => {
  if (el.dataset.slide === 'mid-autumn') {
    new InlinePhotoswipe(el, midAutumnSlides).init();
  } else if (el.dataset.slide === 'thanksgiving') {
    new InlinePhotoswipe(el, thanksgivingSlides).init();
  } else if (el.dataset.slide === 'wxgold') {
    new InlinePhotoswipe(el, wxgoldSlides).init();
  } else if (el.dataset.slide === 'wecard') {
    new InlinePhotoswipe(el, wecardSlides).init();
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9qcy9waG90b3N3aXBlRnJvbURvbS5qcyIsIi4uL2pzL2lubGluZVBob3Rvc3dpcGUuanMiLCIuLi9qcy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgaW5pdFBob3RvU3dpcGVGcm9tRE9NID0gZnVuY3Rpb24gKGdhbGxlcnlTZWxlY3Rvcikge1xuXG4gIC8vIHBhcnNlIHNsaWRlIGRhdGEgKHVybCwgdGl0bGUsIHNpemUgLi4uKSBmcm9tIERPTSBlbGVtZW50cyBcbiAgLy8gKGNoaWxkcmVuIG9mIGdhbGxlcnlTZWxlY3RvcilcbiAgdmFyIHBhcnNlVGh1bWJuYWlsRWxlbWVudHMgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICB2YXIgdGh1bWJFbGVtZW50cyA9IGVsLmNoaWxkTm9kZXMsXG4gICAgICBudW1Ob2RlcyA9IHRodW1iRWxlbWVudHMubGVuZ3RoLFxuICAgICAgaXRlbXMgPSBbXSxcbiAgICAgIGZpZ3VyZUVsLFxuICAgICAgbGlua0VsLFxuICAgICAgc2l6ZSxcbiAgICAgIGl0ZW07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bU5vZGVzOyBpKyspIHtcblxuICAgICAgZmlndXJlRWwgPSB0aHVtYkVsZW1lbnRzW2ldOyAvLyA8ZmlndXJlPiBlbGVtZW50XG5cbiAgICAgIC8vIGluY2x1ZGUgb25seSBlbGVtZW50IG5vZGVzIFxuICAgICAgaWYgKGZpZ3VyZUVsLm5vZGVUeXBlICE9PSAxKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBsaW5rRWwgPSBmaWd1cmVFbC5jaGlsZHJlblswXTsgLy8gPGE+IGVsZW1lbnRcblxuICAgICAgc2l6ZSA9IGxpbmtFbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtc2l6ZScpLnNwbGl0KCd4Jyk7XG5cbiAgICAgIC8vIGNyZWF0ZSBzbGlkZSBvYmplY3RcbiAgICAgIGl0ZW0gPSB7XG4gICAgICAgIHNyYzogbGlua0VsLmdldEF0dHJpYnV0ZSgnaHJlZicpLFxuICAgICAgICB3OiBwYXJzZUludChzaXplWzBdLCAxMCksXG4gICAgICAgIGg6IHBhcnNlSW50KHNpemVbMV0sIDEwKVxuICAgICAgfTtcblxuXG5cbiAgICAgIGlmIChmaWd1cmVFbC5jaGlsZHJlbi5sZW5ndGggPiAxKSB7XG4gICAgICAgIC8vIDxmaWdjYXB0aW9uPiBjb250ZW50XG4gICAgICAgIGl0ZW0udGl0bGUgPSBmaWd1cmVFbC5jaGlsZHJlblsxXS5pbm5lckhUTUw7XG4gICAgICB9XG5cbiAgICAgIGlmIChsaW5rRWwuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyA8aW1nPiB0aHVtYm5haWwgZWxlbWVudCwgcmV0cmlldmluZyB0aHVtYm5haWwgdXJsXG4gICAgICAgIGl0ZW0ubXNyYyA9IGxpbmtFbC5jaGlsZHJlblswXS5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgfVxuXG4gICAgICBpdGVtLmVsID0gZmlndXJlRWw7IC8vIHNhdmUgbGluayB0byBlbGVtZW50IGZvciBnZXRUaHVtYkJvdW5kc0ZuXG4gICAgICBpdGVtcy5wdXNoKGl0ZW0pO1xuICAgIH1cblxuICAgIHJldHVybiBpdGVtcztcbiAgfTtcblxuICAvLyBmaW5kIG5lYXJlc3QgcGFyZW50IGVsZW1lbnRcbiAgdmFyIGNsb3Nlc3QgPSBmdW5jdGlvbiBjbG9zZXN0KGVsLCBmbikge1xuICAgIHJldHVybiBlbCAmJiAoZm4oZWwpID8gZWwgOiBjbG9zZXN0KGVsLnBhcmVudE5vZGUsIGZuKSk7XG4gIH07XG5cbiAgLy8gdHJpZ2dlcnMgd2hlbiB1c2VyIGNsaWNrcyBvbiB0aHVtYm5haWxcbiAgdmFyIG9uVGh1bWJuYWlsc0NsaWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCA/IGUucHJldmVudERlZmF1bHQoKSA6IGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcblxuICAgIHZhciBlVGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG4gICAgLy8gZmluZCByb290IGVsZW1lbnQgb2Ygc2xpZGVcbiAgICB2YXIgY2xpY2tlZExpc3RJdGVtID0gY2xvc2VzdChlVGFyZ2V0LCBmdW5jdGlvbiAoZWwpIHtcbiAgICAgIHJldHVybiAoZWwudGFnTmFtZSAmJiBlbC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09ICdGSUdVUkUnKTtcbiAgICB9KTtcblxuICAgIGlmICghY2xpY2tlZExpc3RJdGVtKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZmluZCBpbmRleCBvZiBjbGlja2VkIGl0ZW0gYnkgbG9vcGluZyB0aHJvdWdoIGFsbCBjaGlsZCBub2Rlc1xuICAgIC8vIGFsdGVybmF0aXZlbHksIHlvdSBtYXkgZGVmaW5lIGluZGV4IHZpYSBkYXRhLSBhdHRyaWJ1dGVcbiAgICB2YXIgY2xpY2tlZEdhbGxlcnkgPSBjbGlja2VkTGlzdEl0ZW0ucGFyZW50Tm9kZSxcbiAgICAgIGNoaWxkTm9kZXMgPSBjbGlja2VkTGlzdEl0ZW0ucGFyZW50Tm9kZS5jaGlsZE5vZGVzLFxuICAgICAgbnVtQ2hpbGROb2RlcyA9IGNoaWxkTm9kZXMubGVuZ3RoLFxuICAgICAgbm9kZUluZGV4ID0gMCxcbiAgICAgIGluZGV4O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1DaGlsZE5vZGVzOyBpKyspIHtcbiAgICAgIGlmIChjaGlsZE5vZGVzW2ldLm5vZGVUeXBlICE9PSAxKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2hpbGROb2Rlc1tpXSA9PT0gY2xpY2tlZExpc3RJdGVtKSB7XG4gICAgICAgIGluZGV4ID0gbm9kZUluZGV4O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIG5vZGVJbmRleCsrO1xuICAgIH1cblxuXG5cbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgLy8gb3BlbiBQaG90b1N3aXBlIGlmIHZhbGlkIGluZGV4IGZvdW5kXG4gICAgICBvcGVuUGhvdG9Td2lwZShpbmRleCwgY2xpY2tlZEdhbGxlcnkpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgLy8gcGFyc2UgcGljdHVyZSBpbmRleCBhbmQgZ2FsbGVyeSBpbmRleCBmcm9tIFVSTCAoIyZwaWQ9MSZnaWQ9MilcbiAgdmFyIHBob3Rvc3dpcGVQYXJzZUhhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSksXG4gICAgICBwYXJhbXMgPSB7fTtcblxuICAgIGlmIChoYXNoLmxlbmd0aCA8IDUpIHtcbiAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfVxuXG4gICAgdmFyIHZhcnMgPSBoYXNoLnNwbGl0KCcmJyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIXZhcnNbaV0pIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB2YXIgcGFpciA9IHZhcnNbaV0uc3BsaXQoJz0nKTtcbiAgICAgIGlmIChwYWlyLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBwYXJhbXNbcGFpclswXV0gPSBwYWlyWzFdO1xuICAgIH1cblxuICAgIGlmIChwYXJhbXMuZ2lkKSB7XG4gICAgICBwYXJhbXMuZ2lkID0gcGFyc2VJbnQocGFyYW1zLmdpZCwgMTApO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJhbXM7XG4gIH07XG5cbiAgdmFyIG9wZW5QaG90b1N3aXBlID0gZnVuY3Rpb24gKGluZGV4LCBnYWxsZXJ5RWxlbWVudCwgZGlzYWJsZUFuaW1hdGlvbiwgZnJvbVVSTCkge1xuICAgIHZhciBwc3dwRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wc3dwJylbMF0sXG4gICAgICBnYWxsZXJ5LFxuICAgICAgb3B0aW9ucyxcbiAgICAgIGl0ZW1zO1xuXG4gICAgaXRlbXMgPSBwYXJzZVRodW1ibmFpbEVsZW1lbnRzKGdhbGxlcnlFbGVtZW50KTtcblxuICAgIC8vIGRlZmluZSBvcHRpb25zIChpZiBuZWVkZWQpXG4gICAgb3B0aW9ucyA9IHtcblxuICAgICAgLy8gZGVmaW5lIGdhbGxlcnkgaW5kZXggKGZvciBVUkwpXG4gICAgICBnYWxsZXJ5VUlEOiBnYWxsZXJ5RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHN3cC11aWQnKSxcblxuICAgICAgZ2V0VGh1bWJCb3VuZHNGbjogZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIC8vIFNlZSBPcHRpb25zIC0+IGdldFRodW1iQm91bmRzRm4gc2VjdGlvbiBvZiBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9cbiAgICAgICAgdmFyIHRodW1ibmFpbCA9IGl0ZW1zW2luZGV4XS5lbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJylbMF0sIC8vIGZpbmQgdGh1bWJuYWlsXG4gICAgICAgICAgcGFnZVlTY3JvbGwgPSB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCxcbiAgICAgICAgICByZWN0ID0gdGh1bWJuYWlsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgIHJldHVybiB7IHg6IHJlY3QubGVmdCwgeTogcmVjdC50b3AgKyBwYWdlWVNjcm9sbCwgdzogcmVjdC53aWR0aCB9O1xuICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8vIFBob3RvU3dpcGUgb3BlbmVkIGZyb20gVVJMXG4gICAgaWYgKGZyb21VUkwpIHtcbiAgICAgIGlmIChvcHRpb25zLmdhbGxlcnlQSURzKSB7XG4gICAgICAgIC8vIHBhcnNlIHJlYWwgaW5kZXggd2hlbiBjdXN0b20gUElEcyBhcmUgdXNlZCBcbiAgICAgICAgLy8gaHR0cDovL3Bob3Rvc3dpcGUuY29tL2RvY3VtZW50YXRpb24vZmFxLmh0bWwjY3VzdG9tLXBpZC1pbi11cmxcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBpdGVtcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGlmIChpdGVtc1tqXS5waWQgPT0gaW5kZXgpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuaW5kZXggPSBqO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBpbiBVUkwgaW5kZXhlcyBzdGFydCBmcm9tIDFcbiAgICAgICAgb3B0aW9ucy5pbmRleCA9IHBhcnNlSW50KGluZGV4LCAxMCkgLSAxO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBvcHRpb25zLmluZGV4ID0gcGFyc2VJbnQoaW5kZXgsIDEwKTtcbiAgICB9XG5cbiAgICAvLyBleGl0IGlmIGluZGV4IG5vdCBmb3VuZFxuICAgIGlmIChpc05hTihvcHRpb25zLmluZGV4KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChkaXNhYmxlQW5pbWF0aW9uKSB7XG4gICAgICBvcHRpb25zLnNob3dBbmltYXRpb25EdXJhdGlvbiA9IDA7XG4gICAgfVxuXG4gICAgLy8gUGFzcyBkYXRhIHRvIFBob3RvU3dpcGUgYW5kIGluaXRpYWxpemUgaXRcbiAgICBnYWxsZXJ5ID0gbmV3IFBob3RvU3dpcGUocHN3cEVsZW1lbnQsIFBob3RvU3dpcGVVSV9EZWZhdWx0LCBpdGVtcywgb3B0aW9ucyk7XG4gICAgZ2FsbGVyeS5pbml0KCk7XG4gIH07XG5cbiAgLy8gbG9vcCB0aHJvdWdoIGFsbCBnYWxsZXJ5IGVsZW1lbnRzIGFuZCBiaW5kIGV2ZW50c1xuICB2YXIgZ2FsbGVyeUVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChnYWxsZXJ5U2VsZWN0b3IpO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZ2FsbGVyeUVsZW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGdhbGxlcnlFbGVtZW50c1tpXS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHN3cC11aWQnLCBpICsgMSk7XG4gICAgZ2FsbGVyeUVsZW1lbnRzW2ldLm9uY2xpY2sgPSBvblRodW1ibmFpbHNDbGljaztcbiAgfVxuXG4gIC8vIGNvbnNvbGUubG9nKCdnYWxsZXJ5RWxlbWVudHMgPT4nLCBnYWxsZXJ5RWxlbWVudHMpO1xuXG4gIC8vIFBhcnNlIFVSTCBhbmQgb3BlbiBnYWxsZXJ5IGlmIGl0IGNvbnRhaW5zICMmcGlkPTMmZ2lkPTFcbiAgdmFyIGhhc2hEYXRhID0gcGhvdG9zd2lwZVBhcnNlSGFzaCgpO1xuICBpZiAoaGFzaERhdGEucGlkICYmIGhhc2hEYXRhLmdpZCkge1xuICAgIG9wZW5QaG90b1N3aXBlKGhhc2hEYXRhLnBpZCwgZ2FsbGVyeUVsZW1lbnRzW2hhc2hEYXRhLmdpZCAtIDFdLCB0cnVlLCB0cnVlKTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgaW5pdFBob3RvU3dpcGVGcm9tRE9NOyIsImNsYXNzIElubGluZVBob3Rvc3dpcGUge1xuICBjb25zdHJ1Y3Rvcihwc3dwTm9kZSwgaXRlbXMpIHtcbiAgICB0aGlzLnBzd3BOb2RlID0gcHN3cE5vZGUgfHwgbnVsbDtcbiAgICB0aGlzLml0ZW1zID0gaXRlbXMgfHwgW107XG5cbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICBpbmRleDogMCxcbiAgICAgIGhpc3Rvcnk6IGZhbHNlLFxuICAgICAgZm9jdXM6IGZhbHNlLFxuICAgICAgbW9kYWw6IGZhbHNlLFxuICAgICAgY2xvc2VPblNjcm9sbDogZmFsc2UsXG4gICAgICBjbG9zZU9uVmVydGljYWxEcmFnOiBmYWxzZSxcbiAgICAgIGNsb3NlRWw6IGZhbHNlLFxuICAgICAgY2xvc2VFbENsYXNzZXM6IFtdLFxuICAgICAgc2hhcmVFbDogZmFsc2UsXG4gICAgICBzaGFyZUJ1dHRvbnM6IFtdLFxuICAgIH07XG4gIFxuICAgIHRoaXMucGhvdG9Td2lwZUluc3QgPSBudWxsO1xuICB9XG5cbiAgaW5pdCgpIHtcbiAgICBpZiAoIXRoaXMucHN3cE5vZGUgfHwgdGhpcy5pdGVtcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIC8vIEluaXRpYWxpemVzIGFuZCBvcGVucyBQaG90b1N3aXBlXG4gICAgdGhpcy5waG90b1N3aXBlSW5zdCA9IG5ldyBQaG90b1N3aXBlKHRoaXMucHN3cE5vZGUsIFBob3RvU3dpcGVVSV9EZWZhdWx0LCB0aGlzLml0ZW1zLCB0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMucGhvdG9Td2lwZUluc3QuaW5pdCgpO1xuXG4gICAgdGhpcy5waG90b1N3aXBlSW5zdC5saXN0ZW4oJ2FmdGVyQ2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgY3VySXRlbSA9IHRoaXMuY3Vyckl0ZW07XG4gICAgICAvLyBzbGlkZSB0byBvbmUgdmlkZW8gaXRlbSBhbmQgYXV0b3BsYXkgdmlkZW9cbiAgICAgIGlmIChjdXJJdGVtLnZpZGVvc3JjKSB7XG4gICAgICAgIGNvbnN0IHZpZGVvTm9kZSA9IGN1ckl0ZW0uY29udGFpbmVyLmNoaWxkcmVuWzBdO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB2aWRlb05vZGUgJiYgdmlkZW9Ob2RlLnBsYXkoKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICAgIH1cbiAgICAgIC8vIHNsaWRlIHRvIGEgbm90IHZpZGVvIGl0ZW0gcGF1c2UgYWxsIHZpZGVvIGl0ZW1zXG4gICAgICBlbHNlIHtcbiAgICAgICAgLy8gY29udGFpbmVyXG4gICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBjdXJJdGVtLmNvbnRhaW5lci5wYXJlbnROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgIGNvbnN0IHZpZGVvTGlzdCA9IHBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbCgndmlkZW8nKTtcbiAgICAgICAgdmlkZW9MaXN0LmZvckVhY2godmkgPT4ge1xuICAgICAgICAgIHZpLnBhdXNlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IElubGluZVBob3Rvc3dpcGU7IiwiaW1wb3J0IHBob3Rvc3dpcGVGcm9tRG9tIGZyb20gJy4vcGhvdG9zd2lwZUZyb21Eb20nO1xuaW1wb3J0IGlubGluZVBob3Rvc3dpcGUgZnJvbSAnLi9pbmxpbmVQaG90b3N3aXBlJztcblxucGhvdG9zd2lwZUZyb21Eb20oJy5zaG93Y2FzZS1nYWxsZXJ5Jyk7XG5cbmNvbnN0IGlubGluZVNob3djYXNlRWxlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5zaG93Y2FzZS1nYWxsZXJ5X19pbmxpbmUnKTtcblxuY29uc3QgbWlkQXV0dW1uU2xpZGVzID0gW1xuICB7XG4gICAgc3JjOiAnYXNzZXRzL3lxdC9jYW1wYWlnbi9taWQtYXV0dW1uL2luZGV4LmpwZycsXG4gICAgdzogNTYyLFxuICAgIGg6IDEyMTgsXG4gICAgdGl0bGU6ICfmtLvli5XpppbpoIEnXG4gIH0sXG4gIHtcbiAgICBzcmM6ICdhc3NldHMveXF0L2NhbXBhaWduL21pZC1hdXR1bW4vcHJvZHVjZS5qcGcnLFxuICAgIHc6IDU2MixcbiAgICBoOiAxMjE4XG4gIH0sXG4gIHtcbiAgICBzcmM6ICdhc3NldHMveXF0L2NhbXBhaWduL21pZC1hdXR1bW4vcG9zdGVyLmpwZycsXG4gICAgdzogNTYyLFxuICAgIGg6IDEyMThcbiAgfSxcbl07XG5cbmNvbnN0IHRoYW5rc2dpdmluZ1NsaWRlcyA9IFtcbiAge1xuICAgIHNyYzogJ2Fzc2V0cy95cXQvY2FtcGFpZ24vdGhhbmtzZ2l2aW5nL2luZGV4LmpwZycsXG4gICAgdzogNTYyLFxuICAgIGg6IDEyMTgsXG4gICAgdGl0bGU6ICfmtLvli5XpppbpoIEnXG4gIH0sXG4gIHtcbiAgICBzcmM6ICdhc3NldHMveXF0L2NhbXBhaWduL3RoYW5rc2dpdmluZy9tZXNzYWdlLmpwZycsXG4gICAgdzogNTYyLFxuICAgIGg6IDEyMThcbiAgfSxcbiAge1xuICAgIHNyYzogJ2Fzc2V0cy95cXQvY2FtcGFpZ24vdGhhbmtzZ2l2aW5nL2xldHRlci5qcGcnLFxuICAgIHc6IDU2MixcbiAgICBoOiAxMjE4XG4gIH0sXG4gIHtcbiAgICB2aWRlb3NyYzogJ2Fzc2V0cy95cXQvY2FtcGFpZ24vdGhhbmtzZ2l2aW5nL1JQUmVwbGF5X0ZpbmFsMTYwNzA5NTA3Ny5tcDQnLFxuICAgIHc6IDU2MixcbiAgICBoOiAxMjE4LFxuICAgIGh0bWw6IGA8dmlkZW8gY29udHJvbHMgbXV0ZWQgZGlzYWJsZVBpY3R1cmVJblBpY3R1cmUgY29udHJvbHNMaXN0PVwibm9kb3dubG9hZFwiIGAgK1xuICAgICAgYHBvc3Rlcj1cImFzc2V0cy95cXQvY2FtcGFpZ24vdGhhbmtzZ2l2aW5nL2xldHRlci5qcGdcIj5gICtcbiAgICAgIGA8c291cmNlIHNyYz1cImFzc2V0cy95cXQvY2FtcGFpZ24vdGhhbmtzZ2l2aW5nL1JQUmVwbGF5X0ZpbmFsMTYwNzA5NTA3Ny5tcDRcIiB0eXBlPVwidmlkZW8vbXA0XCI+YCArXG4gICAgICBgPC92aWRlbz5gLFxuICB9XG5dO1xuXG5jb25zdCB3eGdvbGRTbGlkZXMgPSBbXG4gIHtcbiAgICBzcmM6ICdhc3NldHMvd3hnb2xkL0lNR18xNTY2LmpwZycsXG4gICAgdzogNTYyLFxuICAgIGg6IDEyMTgsXG4gICAgdGl0bGU6ICfph5HmspnntIXljIUnXG4gIH0sXG4gIHtcbiAgICBzcmM6ICdhc3NldHMvd3hnb2xkL0lNR18xNTY3LmpwZycsXG4gICAgdzogNTYyLFxuICAgIGg6IDEyMThcbiAgfSxcbiAge1xuICAgIHNyYzogJ2Fzc2V0cy93eGdvbGQvSU1HXzE1NTQuanBnJyxcbiAgICB3OiA1NjIsXG4gICAgaDogMTIxOFxuICB9LFxuICB7XG4gICAgdmlkZW9zcmM6ICdhc3NldHMvd3hnb2xkL1JQUmVwbGF5X0ZpbmFsMTU2MTQ4MDY5MC5tcDQnLFxuICAgIHc6IDU2MixcbiAgICBoOiAxMjE4LFxuICAgIGh0bWw6IGA8dmlkZW8gY29udHJvbHMgbXV0ZWQgZGlzYWJsZVBpY3R1cmVJblBpY3R1cmUgY29udHJvbHNMaXN0PVwibm9kb3dubG9hZFwiXGI+YCArXG4gICAgICBgPHNvdXJjZSBzcmM9XCJhc3NldHMvd3hnb2xkL1JQUmVwbGF5X0ZpbmFsMTU2MTQ4MDY5MC5tcDRcIiB0eXBlPVwidmlkZW8vbXA0XCI+YCArXG4gICAgICBgPC92aWRlbz5gLFxuICB9XG5dO1xuXG5jb25zdCB3ZWNhcmRTbGlkZXMgPSBbXG4gIHtcbiAgICBzcmM6ICdhc3NldHMvd2VjYXJkL2NvdXBvbi0xLmpwZycsXG4gICAgdzogNTQwLFxuICAgIGg6IDExNzAsXG4gICAgdGl0bGU6ICflhKrmg6DliLjpppbpoIEnXG4gIH0sXG4gIHtcbiAgICBzcmM6ICdhc3NldHMvd2VjYXJkL2NvdXBvbi0yLmpwZycsXG4gICAgdzogNTQwLFxuICAgIGg6IDExNzAsXG4gIH0sXG4gIHtcbiAgICBzcmM6ICdhc3NldHMvd2VjYXJkL2NvdXBvbi0zLmpwZycsXG4gICAgdzogNTQwLFxuICAgIGg6IDExNzAsXG4gIH0sXG4gIHtcbiAgICBzcmM6ICdhc3NldHMvd2VjYXJkL3B0LWluZGV4LmpwZycsXG4gICAgdzogNTYyLFxuICAgIGg6IDE0NDQsXG4gIH0sXG4gIHtcbiAgICBzcmM6ICdhc3NldHMvd2VjYXJkL3B0LWludml0ZWQuanBnJyxcbiAgICB3OiA1NjIsXG4gICAgaDogMTIxOCxcbiAgfSxcbiAge1xuICAgIHZpZGVvc3JjOiAnYXNzZXRzL3dlY2FyZC9SUFJlcGxheV9GaW5hbDE1NjE2MDYwMzkubXA0JyxcbiAgICB3OiA1NjIsXG4gICAgaDogMTIxOCxcbiAgICBodG1sOiBgPHZpZGVvIGNvbnRyb2xzIG11dGVkIGRpc2FibGVQaWN0dXJlSW5QaWN0dXJlIGNvbnRyb2xzTGlzdD1cIm5vZG93bmxvYWRcIlxiIHBvc3Rlcj1cImFzc2V0cy93ZWNhcmQvZXZlbnQtNjE4LmpwZ1wiPmAgK1xuICAgICAgYDxzb3VyY2Ugc3JjPVwiYXNzZXRzL3dlY2FyZC9SUFJlcGxheV9GaW5hbDE1NjE2MDYwMzkubXA0XCIgdHlwZT1cInZpZGVvL21wNFwiPmAgK1xuICAgICAgYDwvdmlkZW8+YCxcbiAgfVxuXTtcblxuaW5saW5lU2hvd2Nhc2VFbGVzLmZvckVhY2goZWwgPT4ge1xuICBpZiAoZWwuZGF0YXNldC5zbGlkZSA9PT0gJ21pZC1hdXR1bW4nKSB7XG4gICAgbmV3IGlubGluZVBob3Rvc3dpcGUoZWwsIG1pZEF1dHVtblNsaWRlcykuaW5pdCgpO1xuICB9IGVsc2UgaWYgKGVsLmRhdGFzZXQuc2xpZGUgPT09ICd0aGFua3NnaXZpbmcnKSB7XG4gICAgbmV3IGlubGluZVBob3Rvc3dpcGUoZWwsIHRoYW5rc2dpdmluZ1NsaWRlcykuaW5pdCgpO1xuICB9IGVsc2UgaWYgKGVsLmRhdGFzZXQuc2xpZGUgPT09ICd3eGdvbGQnKSB7XG4gICAgbmV3IGlubGluZVBob3Rvc3dpcGUoZWwsIHd4Z29sZFNsaWRlcykuaW5pdCgpO1xuICB9IGVsc2UgaWYgKGVsLmRhdGFzZXQuc2xpZGUgPT09ICd3ZWNhcmQnKSB7XG4gICAgbmV3IGlubGluZVBob3Rvc3dpcGUoZWwsIHdlY2FyZFNsaWRlcykuaW5pdCgpO1xuICB9XG59KTtcbiJdLCJuYW1lcyI6WyJpbml0UGhvdG9Td2lwZUZyb21ET00iLCJnYWxsZXJ5U2VsZWN0b3IiLCJwYXJzZVRodW1ibmFpbEVsZW1lbnRzIiwiZWwiLCJ0aHVtYkVsZW1lbnRzIiwiY2hpbGROb2RlcyIsIm51bU5vZGVzIiwibGVuZ3RoIiwiaXRlbXMiLCJmaWd1cmVFbCIsImxpbmtFbCIsInNpemUiLCJpdGVtIiwiaSIsIm5vZGVUeXBlIiwiY2hpbGRyZW4iLCJnZXRBdHRyaWJ1dGUiLCJzcGxpdCIsInNyYyIsInciLCJwYXJzZUludCIsImgiLCJ0aXRsZSIsImlubmVySFRNTCIsIm1zcmMiLCJwdXNoIiwiY2xvc2VzdCIsImZuIiwicGFyZW50Tm9kZSIsIm9uVGh1bWJuYWlsc0NsaWNrIiwiZSIsIndpbmRvdyIsImV2ZW50IiwicHJldmVudERlZmF1bHQiLCJyZXR1cm5WYWx1ZSIsImVUYXJnZXQiLCJ0YXJnZXQiLCJzcmNFbGVtZW50IiwiY2xpY2tlZExpc3RJdGVtIiwidGFnTmFtZSIsInRvVXBwZXJDYXNlIiwiY2xpY2tlZEdhbGxlcnkiLCJudW1DaGlsZE5vZGVzIiwibm9kZUluZGV4IiwiaW5kZXgiLCJvcGVuUGhvdG9Td2lwZSIsInBob3Rvc3dpcGVQYXJzZUhhc2giLCJoYXNoIiwibG9jYXRpb24iLCJzdWJzdHJpbmciLCJwYXJhbXMiLCJ2YXJzIiwicGFpciIsImdpZCIsImdhbGxlcnlFbGVtZW50IiwiZGlzYWJsZUFuaW1hdGlvbiIsImZyb21VUkwiLCJwc3dwRWxlbWVudCIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvckFsbCIsImdhbGxlcnkiLCJvcHRpb25zIiwiZ2FsbGVyeVVJRCIsImdldFRodW1iQm91bmRzRm4iLCJ0aHVtYm5haWwiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsInBhZ2VZU2Nyb2xsIiwicGFnZVlPZmZzZXQiLCJkb2N1bWVudEVsZW1lbnQiLCJzY3JvbGxUb3AiLCJyZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwieCIsImxlZnQiLCJ5IiwidG9wIiwid2lkdGgiLCJnYWxsZXJ5UElEcyIsImoiLCJwaWQiLCJpc05hTiIsInNob3dBbmltYXRpb25EdXJhdGlvbiIsIlBob3RvU3dpcGUiLCJQaG90b1N3aXBlVUlfRGVmYXVsdCIsImluaXQiLCJnYWxsZXJ5RWxlbWVudHMiLCJsIiwic2V0QXR0cmlidXRlIiwib25jbGljayIsImhhc2hEYXRhIiwiSW5saW5lUGhvdG9zd2lwZSIsImNvbnN0cnVjdG9yIiwicHN3cE5vZGUiLCJoaXN0b3J5IiwiZm9jdXMiLCJtb2RhbCIsImNsb3NlT25TY3JvbGwiLCJjbG9zZU9uVmVydGljYWxEcmFnIiwiY2xvc2VFbCIsImNsb3NlRWxDbGFzc2VzIiwic2hhcmVFbCIsInNoYXJlQnV0dG9ucyIsInBob3RvU3dpcGVJbnN0IiwibGlzdGVuIiwiY3VySXRlbSIsImN1cnJJdGVtIiwidmlkZW9zcmMiLCJ2aWRlb05vZGUiLCJjb250YWluZXIiLCJzZXRUaW1lb3V0IiwicGxheSIsInZpZGVvTGlzdCIsImZvckVhY2giLCJ2aSIsInBhdXNlIiwicGhvdG9zd2lwZUZyb21Eb20iLCJpbmxpbmVTaG93Y2FzZUVsZXMiLCJtaWRBdXR1bW5TbGlkZXMiLCJ0aGFua3NnaXZpbmdTbGlkZXMiLCJodG1sIiwid3hnb2xkU2xpZGVzIiwid2VjYXJkU2xpZGVzIiwiZGF0YXNldCIsInNsaWRlIiwiaW5saW5lUGhvdG9zd2lwZSJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFJQSxxQkFBcUIsR0FBRyxTQUF4QkEscUJBQXFCLENBQWFDLGVBQWUsRUFBRTtBQUVyRDtBQUNBO0FBQ0EsRUFBQSxJQUFJQyxzQkFBc0IsR0FBRyxTQUF6QkEsc0JBQXNCLENBQWFDLEVBQUUsRUFBRTtBQUN6QyxJQUFBLElBQUlDLGFBQWEsR0FBR0QsRUFBRSxDQUFDRSxVQUFVO01BQy9CQyxRQUFRLEdBQUdGLGFBQWEsQ0FBQ0csTUFBTTtBQUMvQkMsTUFBQUEsS0FBSyxHQUFHLEVBQUU7TUFDVkMsUUFBUTtNQUNSQyxNQUFNO01BQ05DLElBQUk7TUFDSkMsSUFBSSxDQUFBO0lBRU4sS0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdQLFFBQVEsRUFBRU8sQ0FBQyxFQUFFLEVBQUU7QUFFakNKLE1BQUFBLFFBQVEsR0FBR0wsYUFBYSxDQUFDUyxDQUFDLENBQUMsQ0FBQzs7QUFFNUI7QUFDQSxNQUFBLElBQUlKLFFBQVEsQ0FBQ0ssUUFBUSxLQUFLLENBQUMsRUFBRTtBQUMzQixRQUFBLFNBQUE7QUFDRixPQUFBO01BRUFKLE1BQU0sR0FBR0QsUUFBUSxDQUFDTSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7O01BRTlCSixJQUFJLEdBQUdELE1BQU0sQ0FBQ00sWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRWxEO0FBQ0FMLE1BQUFBLElBQUksR0FBRztBQUNMTSxRQUFBQSxHQUFHLEVBQUVSLE1BQU0sQ0FBQ00sWUFBWSxDQUFDLE1BQU0sQ0FB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