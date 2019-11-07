import Backbone from 'backbone';
import FrameView from './FrameView';
import { bindAll, isNumber, isNull, debounce } from 'underscore';
import { createEl } from 'utils/dom';

const motionsEv =
  'transitionend oTransitionEnd transitionend webkitTransitionEnd';

export default Backbone.View.extend({
  initialize(opts = {}, conf = {}) {
    bindAll(this, 'onScroll', 'frameLoaded');
    const { model } = this;
    const config = {
      ...(opts.config || conf),
      frameWrapView: this
    };
    const { canvasView } = config;
    this.cv = canvasView;
    this.config = config;
    this.em = config.em;
    this.ppfx = config.pStylePrefix || '';
    this.frame = new FrameView({ model, config });
    this.listenTo(model, 'change:x change:y', this.updatePos);
    this.listenTo(model, 'loaded change:width change:height', this.updateDim);
    this.updatePos();
  },

  updateOffset: debounce(function() {
    this.em.runDefault({ preserveSelected: 1 });
  }),

  updatePos(md) {
    const { model, el } = this;
    const { x, y } = model.attributes;
    const { style } = el;
    this.frame.rect = 0;
    style.left = isNaN(x) ? x : `${x}px`;
    style.top = isNaN(y) ? y : `${y}px`;
    md && this.updateOffset();
  },

  /**
   * Update dimensions of the frame
   * @private
   */
  updateDim() {
    const { em, el, $el, model } = this;
    const { width, height } = model.attributes;
    const { style } = el;
    const currW = style.width || '';
    const currH = style.height || '';
    const newW = width;
    const newH = height;
    const noChanges = currW == newW && currH == newH;
    const un = 'px';
    this.frame.rect = 0;
    style.width = isNumber(newW) ? `${newW}${un}` : newW;
    style.height = isNumber(newH) ? `${newH}${un}` : newH;

    // Set width and height from DOM (should be done only once)
    if (isNull(width) || isNull(height)) {
      const newDims = {
        ...(!width ? { width: el.offsetWidth } : {}),
        ...(!height ? { height: el.offsetHeight } : {})
      };
      model.set(newDims, { silent: 1 });
    }

    // Prevent fixed highlighting box which appears when on
    // component hover during the animation
    em.stopDefault({ preserveSelected: 1 });
    noChanges ? this.updateOffset() : $el.one(motionsEv, this.updateOffset);
  },

  onScroll() {
    const { frame, em } = this;
    em.trigger('frame:scroll', {
      frame,
      body: frame.getBody(),
      target: frame.getWindow()
    });
  },

  frameLoaded() {
    const { frame } = this;
    frame.getWindow().onscroll = this.onScroll;
  },

  render() {
    const { frame, $el, ppfx, cv } = this;
    frame.render();
    $el
      .empty()
      .attr({
        class: `${ppfx}frame-wrapper`
      })
      .append(frame.el);
    const elTools = createEl(
      'div',
      {
        class: `${ppfx}tools`,
        style: 'pointer-events:none'
      },
      `
      <div class="${ppfx}highlighter" data-hl></div>
      <div class="${ppfx}badge" data-badge></div>
      <div class="${ppfx}placeholder">
        <div class="${ppfx}placeholder-int"></div>
      </div>
      <div class="${ppfx}ghost"></div>
      <div class="${ppfx}toolbar" style="pointer-events:all"></div>
      <div class="${ppfx}resizer"></div>
      <div class="${ppfx}offset-v" data-offset>
        <div class="gjs-marginName" data-offset-m>
          <div class="gjs-margin-v-el gjs-margin-v-top" data-offset-m-t></div>
          <div class="gjs-margin-v-el gjs-margin-v-bottom" data-offset-m-b></div>
          <div class="gjs-margin-v-el gjs-margin-v-left" data-offset-m-l></div>
          <div class="gjs-margin-v-el gjs-margin-v-right" data-offset-m-r></div>
        </div>
        <div class="gjs-paddingName" data-offset-m>
          <div class="gjs-padding-v-el gjs-padding-v-top" data-offset-p-t></div>
          <div class="gjs-padding-v-el gjs-padding-v-bottom" data-offset-p-b></div>
          <div class="gjs-padding-v-el gjs-padding-v-left" data-offset-p-l></div>
          <div class="gjs-padding-v-el gjs-padding-v-right" data-offset-p-r></div>
        </div>
      </div>
      <div class="${ppfx}offset-fixed-v"></div>
    `
    );
    this.elTools = elTools;
    cv.toolsWrapper.appendChild(elTools); // TODO remove on frame remove
    frame.model.on('loaded', this.frameLoaded);
    return this;
  }
});