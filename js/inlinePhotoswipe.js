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
      shareButtons: [],
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

export default InlinePhotoswipe;